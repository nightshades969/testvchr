import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { db } from './firebase';
//import { collection, addDoc, getDocs } from 'firebase/firestore
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Timestamp } from "firebase/firestore";

function fillAra() {
  return [
    0x8000, 0x8007, 0x8038, 0x803F,
    0x81C0, 0x81C7, 0x81F8, 0x81FF,
    0x8E00, 0x8E07, 0x8E38, 0x8E3F,
    0x8FC0, 0x8FC7, 0x8FF8, 0x8FFF,
    0xF000, 0xF007, 0xF038, 0xF03F,
    0xF1C0, 0xF1C7, 0xF1F8, 0xF1FF,
    0xFE00, 0xFE07, 0xFE38, 0xFE3F,
    0xFFC0, 0xFFC7, 0xFFF8, 0xFFFF
  ];
}

function dwriteinstreamcode(instval, ara) {
  const ch = [];
  const mwrtstr = instval.toString().padStart(4, "0");
  let idxw = 15;
  for (let i = 3; i >= 0; i--) {
    const digit = parseInt(mwrtstr[i], 10);
    const mshort = ara[digit + idxw];
    ch.push((mshort >> 8) & 0xFF);
    ch.push(mshort & 0xFF);
    idxw++;
  }
  return ch;
}

function byteArrayToHex(byteArray) {
  return byteArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHexGroupedBy4Bytes(byteArray) {
  const hexPairs = byteArray.map(b => b.toString(16).padStart(2, '0').toUpperCase());
  const words = [];

  for (let i = 0; i < hexPairs.length; i += 2) {
    const word = (hexPairs[i] || '') + (hexPairs[i + 1] || '');
    words.push(word);
  }

  return words.join(' ');
  
}

function desEncrypt(text, keyBytes, ivBytes) {
  const toHex = (bytes) => bytes.map(b => ("00" + b.toString(16)).slice(-2)).join(" ");
  const toHexSpaced = (bytes) => bytes.map(b => ("00" + b.toString(16)).slice(-2)).join(" ").toUpperCase();

  const key = CryptoJS.enc.Hex.parse(byteArrayToHex(keyBytes));
  const iv = CryptoJS.enc.Hex.parse(byteArrayToHex(ivBytes));

  const encrypted = CryptoJS.DES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const vhrToken = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
  const byteArray = [];
  for (let i = 0; i < vhrToken.length; i += 2) {
    byteArray.push(parseInt(vhrToken.substring(i, i + 2), 16));
  }

  return {
    //vhcr: toHexSpaced(byteArray),
	vhcr: toHexGroupedBy4Bytes(byteArray),

    keyHex: toHex(keyBytes).toUpperCase(),
    ivHex: toHex(ivBytes).toUpperCase()
  };
}

function toHex(val) {
  if (!val || isNaN(val)) return "0x0000";
  let hex = parseInt(val, 10).toString(16).toUpperCase();
  return "0x" + hex.padStart(4, "0");
}

async function testWrite() {
  try {
    const docRef = await addDoc(collection(db, "testCollection"), {
      message: "Hello Firebase!",
      timestamp: Date.now()
    });
    alert("Document written with ID: " + docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}





function App() {
  const [tnop, setTnop] = useState("");
  const [tcnt, setTcnt] = useState("");
  const [tcrd, setTcrd] = useState("");
  const [output, setOutput] = useState({ vhcr: "", keyHex: "", ivHex: "" });
  
  async function saveToDatabase() {
  try {
    await addDoc(collection(db, "encryptHistory"), {
      tnop,
      tcnt,
      tcrd,
      timestamp: Date.now()
    });
    alert("Saved to database!");
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function loadHistory() {
  try {
    const querySnapshot = await getDocs(collection(db, "encryptHistory"));
    const allData = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      let readableTimestamp = "";

      if (data.timestamp instanceof Timestamp) {
        readableTimestamp = data.timestamp.toDate().toLocaleString();
      } else if (typeof data.timestamp === "number") {
        readableTimestamp = new Date(data.timestamp).toLocaleString();
      } else {
        readableTimestamp = data.timestamp || "";
      }

      allData.push({
        ...data,
        readableTimestamp,
      });
    });

    console.log("History:", allData);
    alert(JSON.stringify(allData, null, 2));
  } catch (e) {
    console.error("Error fetching history: ", e);
  }
}



  function handleEncrypt() {
    const ara = fillAra();
    const nopVal = parseInt(tnop, 10);
    const cntVal = parseInt(tcnt, 10);

    if (isNaN(nopVal) || isNaN(cntVal) || !tcrd) {
      setOutput({ vhcr: "Invalid input values", keyHex: "", ivHex: "" });
      return;
    }

    const iv = dwriteinstreamcode(nopVal, ara);
    const key = dwriteinstreamcode(cntVal, ara);

    try {
      const result = desEncrypt(tcrd + "\r\n", key, iv);
      setOutput(result);
    } catch (error) {
      console.error("Encryption failed:", error);
      setOutput({ vhcr: "Encryption failed: " + error.message, keyHex: "", ivHex: "" });
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>VB.NET DES Encryptor (Web Version)</h2>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="number"
          placeholder="Tnop"
          value={tnop}
          onChange={e => {
            setTnop(e.target.value);
            setOutput({ vhcr: "", keyHex: "", ivHex: "" });
          }}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />
        <input
          type="number"
          placeholder="Tcnt"
          value={tcnt}
          onChange={e => {
            setTcnt(e.target.value);
            setOutput({ vhcr: "", keyHex: "", ivHex: "" });
          }}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />
        <input
          placeholder="Tcrd (Text to Encrypt)"
          value={tcrd}
          onChange={e => {
            setTcrd(e.target.value);
            setOutput({ vhcr: "", keyHex: "", ivHex: "" });
          }}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />
        <button onClick={handleEncrypt} style={{ padding: "10px 20px" }}>
          Encrypt
        </button>
		<button onClick={saveToDatabase} style={{ padding: "10px 20px", marginLeft: "10px" }}>
		  Save
		</button>
		<button onClick={loadHistory} style={{ padding: "10px 20px", marginLeft: "10px" }}>
		  Load History
		</button>
		<button onClick={testWrite}>Test Firebase Write</button>
		
      </div>

      <div style={{ fontFamily: "monospace", wordWrap: "break-word" }}>
        <strong>Tnop (hex)       :</strong> {toHex(tnop)}<br />
        <strong>Tcnt (hex)       :</strong> {toHex(tcnt)}<br />
        <strong>Tcrd (ASCII > Hex):</strong> {Array.from(tcrd).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(" ").toUpperCase()}<br />
        <strong>Key Bytes (hex)  :</strong> {output.keyHex}<br />
        <strong>IV Bytes (hex)   :</strong> {output.ivHex}<br />
        <strong>Encrypted Output :</strong> {output.vhcr}<br />
      </div>
    </div>
  );
}

export default App;
