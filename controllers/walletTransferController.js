import supabase from "../config/supabaseClient.js";

/*
=========================================================
  🔵 SEND MONEY TO ANOTHER WALLET
=========================================================
*/
export const sendMoney = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiver_address, amount, note } = req.body;

    if (!receiver_address || !amount)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const amt = Number(amount);
    if (amt <= 0)
      return res.status(400).json({ success: false, message: "Invalid amount" });

    // ────────── Find Receiver Wallet ──────────
    const { data: receiverWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("wallet_address", receiver_address)
      .maybeSingle();

    if (!receiverWallet)
      return res.status(400).json({ success: false, message: "Invalid wallet address" });

    const receiverId = receiverWallet.driver_id;

    if (receiverId === senderId)
      return res.status(400).json({ success: false, message: "Cannot send to yourself" });

    // ────────── Load Sender Wallet ──────────
    const { data: senderWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("driver_id", senderId)
      .maybeSingle();

    if (!senderWallet)
      return res.status(400).json({ success: false, message: "Sender wallet not found" });

    if (amt > Number(senderWallet.available_balance))
      return res.status(400).json({ success: false, message: "Insufficient funds" });

    // ────────── Update Balances ──────────
    const newSenderBalance = Number(senderWallet.available_balance) - amt;
    const newReceiverBalance = Number(receiverWallet.available_balance) + amt;

    const { error: sErr } = await supabase
      .from("wallets")
      .update({ available_balance: newSenderBalance })
      .eq("driver_id", senderId);

    const { error: rErr } = await supabase
      .from("wallets")
      .update({ available_balance: newReceiverBalance })
      .eq("driver_id", receiverId);

    if (sErr || rErr)
      return res.status(500).json({ success: false, message: "Transaction failed" });

    // ────────── Log Transfer ──────────
    await supabase.from("wallet_transfers").insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        amount: amt,
        note,
      },
    ]);

    // ────────── Log Transactions ──────────
    await supabase.from("wallet_transactions").insert([
      {
        driver_id: senderId,
        amount: amt,
        type: "debit",
        source: "transfer",
        description: note || "Money sent",
      },
      {
        driver_id: receiverId,
        amount: amt,
        type: "credit",
        source: "transfer",
        description: note || "Money received",
      },
    ]);

    return res.json({ success: true, message: "Transfer successful" });
  } catch (err) {
    console.error("Send Money Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/*
=========================================================
  🟢 RECEIVE INFO (WALLET ADDRESS + QR CODE)
=========================================================
*/
export const getReceiveInfo = async (req, res) => {
  try {
    const driverId = req.user?.id;

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("wallet_address")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      success: true,
      wallet_address: wallet.wallet_address,
      qr_string: `gride:${wallet.wallet_address}`,
    });
  } catch (err) {
    console.error("Receive Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
