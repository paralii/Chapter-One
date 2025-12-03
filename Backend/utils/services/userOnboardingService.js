import Wallet from "../../models/Wallet.js";
import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import { creditWallet } from "../../controllers/user/userWalletController.js";
import { logger, errorLogger } from "../logger.js";

export const ensureUserOnboarding = async (
  user,
  options = {}
) => {
  const { referred_by = null, firstNameForMessage = null } = options;

  try {
    const [wallet, cart, wishlist] = await Promise.all([
      Wallet.findOne({ user_id: user._id }),
      Cart.findOne({ user_id: user._id }),
      Wishlist.findOne({ user_id: user._id }),
    ]);

    const ops = [];

    if (!wallet) {
      ops.push(Wallet.create({ user_id: user._id, balance: 0 }));
    }

    if (!cart) {
      ops.push(Cart.create({ user_id: user._id, items: [] }));
    }

    if (!wishlist) {
      ops.push(Wishlist.create({ user_id: user._id, products: [] }));
    }

    if (referred_by) {
      ops.push(
        creditWallet(
          user._id,
          50,
          "Referral bonus for signing up"
        ),
        creditWallet(
          referred_by,
          100,
          `Referral reward for inviting ${firstNameForMessage || "a friend"}`
        )
      );
    }

    if (ops.length) {
      await Promise.all(ops);
    }
  } catch (err) {
    errorLogger.error("User onboarding error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};


