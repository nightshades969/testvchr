import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { db } from "./firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";

// Lookup Table Generator
function fillAra() {
  return [
    0x8000, 0x8007, 0x8038, 0x803F, 0x81C0, 0x81C7, 0x81F8, 0x81FF,
    0x8E00, 0x8E07, 0x8E38, 0x8E3F, 0x8FC0, 0x8FC7, 0x8FF8, 0x8FFF,
    0xF000, 0xF007, 0xF038, 0xF03F, 0xF1C0, 0xF1C7, 0xF1F8, 0xF1FF,
    0xFE00, 0xFE07, 0xFE38, 0xFE3F, 0xFFC0, 0xFFC7, 0xFFF8, 0xFFFF,
  ];
}

// Converts a number into a special byte array using the lookup
function dwriteinstreamcode(instval, ara) {
  const ch = [];
  const mwrtstr = instval.toString().padStart(4, "0");
  let idxw = 15;

  for (let i = 3; i >= 0; i--) {
    const digit = parseInt(mwrtstr[i], 10);
    const mshort = ara[digit + idxw];
    ch.push((mshort >> 8) & 0xff);
    ch.push(mshort & 0xff);
    idxw++;
  }

  return ch;
}

// Converts byte array to hex string
function byteArrayToHex(byteArray) {
  return byteArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Formats hex into grouped words
function toHexGroupedBy4Bytes(byteArray) {
  const hexPairs = byteArray.map((b) =>
    b.toString(16).padStart(2, "0").toUpperCase()
  );
  const words = [];

  for (let i = 0; i < hexPairs.length; i += 2) {
    const word = (hexPairs[i] || "") + (hexPairs[i + 1] || "");
    words.push(word);
  }

  return words.join(" ");
}

// DES Encryption with key and IV
function desEncrypt(text, keyBytes, ivBytes) {
  const toHex = (bytes) =>
    bytes.map((b) => ("00" + b.toString(16)).slice(-2)).join(" ");

  const key = CryptoJS.enc.Hex.parse(byteArrayToHex(keyBytes));
  const iv = CryptoJS.enc.Hex.parse(byteArrayToHex(ivBytes));

  const encrypted = CryptoJS.DES.encrypt(text, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const vhrToken = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
  const byteArray = [];

  for (let i = 0; i < vhrToken.length; i += 2) {
    byteArray.push(parseInt(vhrToken.substring(i, i + 2), 16));
  }

  return {
    vhcr: toHexGroupedBy4Bytes(byteArray),
    keyHex: toHex(keyBytes).toUpperCase(),
    ivHex: toHex(ivBytes).toUpperCase(),
  };
}

function App() {
  const [tnop, setTnop] = useState("");
  const [tcnt, setTcnt] = useState("");
  const [tcrd, setTcrd] = useState("");
  const [output, setOutput] = useState({ vhcr: "", keyHex: "", ivHex: "" });
  const [history, setHistory] = useState([]);

  async function saveToDatabase() {
    try {
      await addDoc(collection(db, "encryptHistory"), {
        tnop,
        tcnt,
        tcrd,
        vhcr: output.vhcr,
        timestamp: Date.now(),
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

        allData.push({ ...data, readableTimestamp });
      });

      // Sort by tnop (as number) and then timestamp
      allData.sort((a, b) => {
        const tnopA = parseInt(a.tnop, 10);
        const tnopB = parseInt(b.tnop, 10);

        if (tnopA !== tnopB) return tnopA - tnopB;

        const timeA =
          typeof a.timestamp === "number"
            ? a.timestamp
            : a.timestamp instanceof Timestamp
            ? a.timestamp.toMillis()
            : 0;

        const timeB =
          typeof b.timestamp === "number"
            ? b.timestamp
            : b.timestamp instanceof Timestamp
            ? b.timestamp.toMillis()
            : 0;

        return timeA - timeB;
      });

      setHistory(allData);
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
      setOutput({
        vhcr: "Encryption failed: " + error.message,
        keyHex: "",
        ivHex: "",
      });
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>*** Encryptor *** 0608 AH *** 1888 DH </h2>
	  <div style={{ marginBottom: "10px" }}>
        <input
          type="number"
          placeholder="Tnop"
          value={tnop}
          onChange={(e) => {
            setTnop(e.target.value);
            setOutput({ vhcr: "", keyHex: "", ivHex: "" });
          }}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />
        <input
          type="number"
          placeholder="Tcnt"
          value={tcnt}
          onChange={(e) => {
            setTcnt(e.target.value);
            setOutput({ vhcr: "", keyHex: "", ivHex: "" });
          }}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />
        <input
          placeholder="Tcrd (Text to Encrypt)"
          value={tcrd}
          onChange={(e) => {
            setTcrd(e.target.value);
            setOutput({ vhcr: "", keyHex: "", ivHex: "" });
          }}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />

        <button onClick={handleEncrypt} style={{ padding: "10px 20px" }}>
          Encrypt
        </button>

        <button
          onClick={saveToDatabase}
          disabled={!output.vhcr}
          style={{
            padding: "10px 20px",
            marginLeft: "10px",
            opacity: output.vhcr ? 1 : 0.5,
            cursor: output.vhcr ? "pointer" : "not-allowed",
          }}
        >
          Save
        </button>

        <button
          onClick={loadHistory}
          style={{ padding: "10px 20px", marginLeft: "10px" }}
        >
          Load History
        </button>
      </div>

      <h2 style={{ fontFamily: "monospace", wordWrap: "break-word" }}>
        Encrypted Output : {output.vhcr}
      </h2>

      <div style={{ marginBottom: "10px" }}>
        <h2>Encryption History</h2>
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", marginTop: "20px" }}
        >
          <thead>
            <tr>
              <th>TNOP</th>
              <th>TCNT</th>
              <th>TCRD</th>
              <th>VHCR</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index}>
                <td>{item.tnop}</td>
                <td>{item.tcnt}</td>
                <td>{item.tcrd}</td>
                <td>{item.vhcr}</td>
                <td>{item.readableTimestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
