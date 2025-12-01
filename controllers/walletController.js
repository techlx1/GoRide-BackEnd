import supabase from "../config/supabaseClient.js";

/*
==============================================================
  💰 GET WALLET OVERVIEW
  - Creates wallet if it doesn't exist
  - Returns wallet + last 10 transactions
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
            wallet_address: null, // will set below
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;
      wallet = newWallet;

      // Ensure wallet_address is set
      if (!wallet.wallet_address) {
        const { data: updatedWallet, error: addressError } = await supabase
          .from("wallets")
          .update({
            wallet_address: wallet.id, // fallback, you can change to UUID hex
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
  📜 GET WALLET TRANSACTIONS (paginated)
==============================================================
*/
export const getWalletTransactions = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

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
  - Deducts from available_balance
  - Logs a DEBIT transaction
==============================================================
*/
export const requestPayout = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const { amount, method, note } = req.body;
    const payoutAmount = Number(amount);

    if (!payoutAmount || payoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payout amount",
      });
    }

    // Load wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (walletError) throw walletError;
    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (payoutAmount > Number(wallet.available_balance)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    const newBalance = Number(wallet.available_balance) - payoutAmount;

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from("wallets")
      .update({
        available_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", driverId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    // Insert wallet transaction
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          driver_id: driverId,
          amount: payoutAmount,
          type: "debit",
          source: "payout",
          description:
            note || `Payout requested via ${method || "wallet"}`,
        },
      ]);

    if (txError) throw txError;

    return res.json({
      success: true,
      message: "Payout requested successfully",
      wallet: updatedWallet,
    });
  } catch (err) {
    console.error("requestPayout Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to request payout",
      error: err.message,
    });
  }
};

/*
==============================================================
  🔄 SEND MONEY (wallet → wallet)
==============================================================
*/
export const sendMoney = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const { receiver_wallet_id, amount, note } = req.body;

    if (!receiver_wallet_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Receiver wallet ID and amount are required",
      });
    }

    const sendAmount = Number(amount);
    if (!sendAmount || sendAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Receiver wallet by wallet_address
    const { data: receiverWallet, error: recvError } = await supabase
      .from("wallets")
      .select("*")
      .eq("wallet_address", receiver_wallet_id)
      .maybeSingle();

    if (recvError) throw recvError;

    if (!receiverWallet) {
      return res.status(400).json({
        success: false,
        message: "Receiver wallet not found",
      });
    }

    const receiverId = receiverWallet.driver_id;

    if (receiverId === senderId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send money to yourself",
      });
    }

    // Sender wallet
    const { data: senderWallet, error: senderError } = await supabase
      .from("wallets")
      .select("*")
      .eq("driver_id", senderId)
      .maybeSingle();

    if (senderError) throw senderError;

    if (!senderWallet) {
      return res.status(400).json({
        success: false,
        message: "Sender wallet not found",
      });
    }

    if (sendAmount > Number(senderWallet.available_balance)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const newSenderBal =
      Number(senderWallet.available_balance) - sendAmount;
    const newReceiverBal =
      Number(receiverWallet.available_balance) + sendAmount;

    // Update sender
    const { error: updSenderErr } = await supabase
      .from("wallets")
      .update({
        available_balance: newSenderBal,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", senderId);

    if (updSenderErr) throw updSenderErr;

    // Update receiver
    const { error: updRecvErr } = await supabase
      .from("wallets")
      .update({
        available_balance: newReceiverBal,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", receiverId);

    if (updRecvErr) throw updRecvErr;

    // Log transfer
    const { error: transferErr } = await supabase
      .from("wallet_transfers")
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          amount: sendAmount,
          note,
        },
      ]);

    if (transferErr) throw transferErr;

    // Log wallet transactions
    const { error: txErr } = await supabase
      .from("wallet_transactions")
      .insert([
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

    if (txErr) throw txErr;

    return res.json({
      success: true,
      message: "Money sent successfully",
    });
  } catch (err) {
    console.error("sendMoney Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send money",
      error: err.message,
    });
  }
};

/*
==============================================================
  📥 GET RECEIVE INFO
  - returns wallet_address + optional qr_string
==============================================================
*/
export const getReceiveInfo = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("wallet_address")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (error) throw error;

    if (!wallet || !wallet.wallet_address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address not found",
      });
    }

    return res.json({
      success: true,
      wallet_address: wallet.wallet_address,
      qr_string: `gride:${wallet.wallet_address}`,
    });
  } catch (err) {
    console.error("getReceiveInfo Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get receive info",
      error: err.message,
    });
  }
};
