import { supabase } from "../config/supabaseClient.js";

/*
==============================================================
  💰 GET WALLET OVERVIEW
==============================================================
*/
export const getWalletOverview = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    // 1) Get wallet
    let { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (walletError) throw walletError;

    // 2) Create wallet if missing
    if (!wallet) {
      const { data: newWallet, error: insertError } = await supabase
        .from("wallets")
        .insert([
          {
            driver_id: driverId,
            available_balance: 0,
            pending_balance: 0,
            currency: "GYD",
            wallet_address: null,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      wallet = newWallet;

      // Assign wallet address if missing
      if (!wallet.wallet_address) {
        const { data: updatedWallet, error: addressError } = await supabase
          .from("wallets")
          .update({
            wallet_address: wallet.id.replace(/-/g, ""), // 🔥 clean wallet address
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id)
          .select()
          .maybeSingle();

        if (addressError) throw addressError;
        wallet = updatedWallet;
      }
    }

    // 3) Get recent transactions
    const { data: transactions, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (txError) throw txError;

    return res.json({
      success: true,
      wallet,
      transactions: transactions || [],
    });
  } catch (err) {
    console.error("getWalletOverview Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load wallet",
      error: err.message,
    });
  }
};

/*
==============================================================
  📜 GET WALLET TRANSACTIONS
==============================================================
*/
export const getWalletTransactions = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.json({
      success: true,
      transactions: data || [],
    });
  } catch (err) {
    console.error("getWalletTransactions Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load transactions",
      error: err.message,
    });
  }
};

/*
==============================================================
  💸 REQUEST PAYOUT
==============================================================
*/
export const requestPayout = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { amount, method, note } = req.body;
    const payoutAmount = Number(amount);

    if (!payoutAmount || payoutAmount <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid payout amount",
      });

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (!wallet)
      return res.status(400).json({ success: false, message: "Wallet not found" });

    if (payoutAmount > Number(wallet.available_balance))
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });

    const newBalance = Number(wallet.available_balance) - payoutAmount;

    await supabase
      .from("wallets")
      .update({
        available_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", driverId);

    await supabase.from("wallet_transactions").insert([
      {
        driver_id: driverId,
        amount: payoutAmount,
        type: "debit",
        source: "payout",
        description: note || `Payout via ${method ?? "wallet"}`,
      },
    ]);

    return res.json({
      success: true,
      message: "Payout requested successfully",
    });
  } catch (err) {
    console.error("requestPayout Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to request payout",
    });
  }
};

/*
==============================================================
 🔄 SEND MONEY
==============================================================
*/
export const sendMoney = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { receiver_wallet_id, amount, note } = req.body;
    const sendAmount = Number(amount);

    if (!receiver_wallet_id || !sendAmount)
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });

    if (sendAmount <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });

    // receiver wallet
    const { data: receiverWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("wallet_address", receiver_wallet_id)
      .maybeSingle();

    if (!receiverWallet)
      return res.status(400).json({
        success: false,
        message: "Receiver wallet not found",
      });

    const receiverId = receiverWallet.driver_id;
    if (receiverId === senderId)
      return res.status(400).json({
        success: false,
        message: "Cannot send to yourself",
      });

    // sender wallet
    const { data: senderWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("driver_id", senderId)
      .maybeSingle();

    if (sendAmount > Number(senderWallet.available_balance))
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });

    // new balances
    const newSenderBal = Number(senderWallet.available_balance) - sendAmount;
    const newReceiverBal =
      Number(receiverWallet.available_balance) + sendAmount;

    // update sender
    await supabase
      .from("wallets")
      .update({
        available_balance: newSenderBal,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", senderId);

    // update receiver
    await supabase
      .from("wallets")
      .update({
        available_balance: newReceiverBal,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", receiverId);

    // log transactions
    await supabase.from("wallet_transactions").insert([
      {
        driver_id: senderId,
        amount: sendAmount,
        type: "debit",
        source: "transfer",
        description: note || "Money sent",
      },
      {
        driver_id: receiverId,
        amount: sendAmount,
        type: "credit",
        source: "transfer",
        description: note || "Money received",
      },
    ]);

    return res.json({
      success: true,
      message: "Money sent successfully",
    });
  } catch (err) {
    console.error("sendMoney Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send money",
    });
  }
};

/*
==============================================================
 📥 GET RECEIVE INFO
==============================================================
*/
export const getReceiveInfo = async (req, res) => {
  try {
    const driverId = req.user?.id;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("wallet_address")
      .eq("driver_id", driverId)
      .maybeSingle();

    return res.json({
      success: true,
      wallet_address: wallet.wallet_address,
      qr_string: `gride:${wallet.wallet_address}`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to get receive info",
    });
  }
};
