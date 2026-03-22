"use client";

import { useState, useEffect } from "react";

const PASSWORD = "budo123";
const SESSION_COST = 32;

export default function PaymentTracker() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const [practiceDate, setPracticeDate] = useState("");
  const [practices, setPractices] = useState([]);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem("budo-data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setMembers(parsed.members || []);
      setPractices(parsed.practices || []);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(
      "budo-data",
      JSON.stringify({ members, practices })
    );
  }, [members, practices]);

  // 🔥 Recalculate balances
  const recalculateBalances = (membersData, practicesData) => {
    return membersData.map((member) => {
      // total deposits
      let balance = member.history
        ?.filter((h) => h.type === "tallennus")
        .reduce((sum, h) => sum + h.amount, 0) || 0;

      // subtract practice costs
      practicesData.forEach((p) => {
        if (p.attendees.includes(member.name)) {
          const share =
            p.attendees.length > 0
              ? SESSION_COST / p.attendees.length
              : 0;
          balance -= share;
        }
      });

      return { ...member, balance };
    });
  };

  // Always keep balances updated
  useEffect(() => {
    const updated = recalculateBalances(members, practices);
    setMembers(updated);
  }, [practices, members.length]);

  const login = () => {
    if (passwordInput === PASSWORD) setAuthenticated(true);
    else alert("Väärä salasana.");
  };

  const addMember = () => {
    if (!name) return;
    setMembers([...members, { name, balance: 0, history: [] }]);
    setName("");
  };

  const deleteMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  };

  const addDeposit = (index) => {
    if (!depositAmount) return;

    const amount = parseFloat(depositAmount);
    const updated = [...members];

    if (!updated[index].history) updated[index].history = [];

    updated[index].history.push({
      type: "tallennus",
      amount,
      date: new Date().toLocaleDateString(),
    });

    setMembers(recalculateBalances(updated, practices));
    setDepositAmount("");
  };

  const createPractice = () => {
    if (!practiceDate) return;

    setPractices([
      ...practices,
      { date: practiceDate, attendees: [] },
    ]);

    setPracticeDate("");
  };

  const deletePractice = (index) => {
    const updated = practices.filter((_, i) => i !== index);
    setPractices(updated);
  };

  const toggleAttendee = (practiceIndex, memberName) => {
    const updated = [...practices];
    const attendees = updated[practiceIndex].attendees;

    if (attendees.includes(memberName)) {
      updated[practiceIndex].attendees = attendees.filter(
        (a) => a !== memberName
      );
    } else {
      updated[practiceIndex].attendees.push(memberName);
    }

    setPractices(updated);
  };

  if (!authenticated) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Treenimaksut</h2>

        <input
          type="password"
          placeholder="Salasana"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") login();
          }}
        />

        <button onClick={login}>Kirjaudu</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Treenimaksut</h1>

      {/* ADD PRACTICE */}
      <div style={{ border: "2px solid black", padding: 15, marginBottom: 20 }}>
        <h2>Lisää harjoitus</h2>

        <input
          type="date"
          value={practiceDate}
          onChange={(e) => setPracticeDate(e.target.value)}
        />

        <button onClick={createPractice}>Lisää harjoitus</button>
      </div>

      {/* PRACTICES */}
      {practices.map((p, i) => (
        <div
          key={i}
          style={{ border: "1px solid black", padding: 15, marginBottom: 15 }}
        >
          <h3>{p.date}</h3>

          <span
            onClick={() => deletePractice(i)}
            style={{ color: "red", cursor: "pointer", display: "block" }}
          >
            Poista harjoitus
          </span>

          <p>
            Jaettu maksu: €
            {p.attendees.length > 0
              ? (SESSION_COST / p.attendees.length).toFixed(2)
              : SESSION_COST.toFixed(2)}
          </p>

          <h4>Osallistujat</h4>
          {members.map((m, idx) => (
            <label key={idx} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={p.attendees.includes(m.name)}
                onChange={() => toggleAttendee(i, m.name)}
              />
              {m.name}
            </label>
          ))}
        </div>
      ))}

      {/* MEMBERS */}
      <div style={{ border: "2px solid black", padding: 15 }}>
        <h2>Treenaajat</h2>

        <input
          placeholder="Treenaaja"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addMember();
          }}
        />

        <button onClick={addMember}>Lisää treenaaja</button>

        {members.map((member, index) => {
          const totalDeposits =
            member.history
              ?.filter((h) => h.type === "tallennus")
              .reduce((sum, h) => sum + h.amount, 0) || 0;

          return (
            <div
              key={index}
              style={{
                border: "1px solid gray",
                marginTop: 10,
                padding: 10,
              }}
            >
              <h3>{member.name}</h3>

              <p>Talletukset: €{totalDeposits.toFixed(2)}</p>

              <p>Saldo: €{member.balance.toFixed(2)}</p>

              <span
                onClick={() => deleteMember(index)}
                style={{ color: "red", cursor: "pointer" }}
              >
                Poista treenaaja
              </span>

              <br />

              <input
                type="number"
                placeholder="Talletus"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addDeposit(index);
                }}
              />

              <button onClick={() => addDeposit(index)}>Lisää</button>

              <ul>
                {member.history.map((h, i) => (
                  <li key={i}>
                    {h.date} — {h.type} €{h.amount}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}