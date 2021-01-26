const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const formidableMiddleware = require("express-formidable");
router.use(formidableMiddleware());

const stripe = createStripe(process.env.STRIPE_API_SECRET);

// Réception du token
router.post("/payment", async (req, res) => {
  try {
    // Envoi du token a Stripe avec le montant
    let { status } = await stripe.charges.create({
      amount: req.fields.amount * 100,
      currency: "eur",
      description: `Paiement vinted pour : ${req.fields.title}`,
      source: req.fields.token,
    });
    // Le paiement a fonctionné > mise à jour de la base de donnée > envoi d'une réponse au client, affichage d'un message de statut
    res.json({ status });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
