const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

// Package qui permet de générer des données aléatoires (ne pas en tenir compte, cela sert à réinitiliser la BDD entre 2 sessions de formation)
// const faker = require("faker");
// faker.locale = "fr";
// const owners = require("../data/owners.json");

const User = require("../models/User");
const Offer = require("../models/Offer");

// SIGNUP
router.post("/user/signup", async (req, res) => {
  try {
    // Recherche dans BDD si email déjà existant > si oui : erreur > si non : création
    const user = await User.findOne({ email: req.fields.email });
    if (user) {
      res.status(409).json({ message: "This email already has an account" });
    } else {
      // informations requises ? > non : erreur > oui : création
      if (req.fields.email && req.fields.password && req.fields.username) {
        res.status(400).json({ message: "Missing parameters" });
      } else {

        // Étape 1 : Générer token et encrypter mdp
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);

        // Étape 2 : créer nouvel utilisateur
        const newUser = new User({
          email: req.fields.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
        });

        // Étape 3 : sauvegarder dans BDD
        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
        
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

// LOGIN
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      // bon mdp ?
      if (
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
});

// // CETTE ROUTE SERT AU RESET DE LA BDD ENTRE 2 SESSIONS DE FORMATION. CELA NE FAIT PAS PARTIE DE L'EXERCICE.
// router.get("/reset-users", async (req, res) => {
//   if (req.headers.authorization) {
//     const token = req.headers.authorization.replace("Bearer ", "");

//     if (token !== process.env.ADMIN_TOKEN) {
//       res.status(401).json({ error: "Unauthorized" });
//     } else {
//       // Vider la collection User
//       await User.deleteMany({});

//       // Supprimer le dossier "api/vinted/users" sur cloudinary

//       // Pour cela, il faut supprimer les images, cloudinary ne permettant pas de supprimer des dossiers qui ne sont pas vides
//       try {
//         const deleteResources = await cloudinary.api.delete_resources_by_prefix(
//           "api/vinted/users"
//         );
//         console.log("deleteResources ===>  ", deleteResources);
//       } catch (error) {
//         console.log("deleteResources ===>  ", error.message);
//       }

//       // Maintenant les dossiers vides, on peut les supprimer
//       try {
//         const deleteFolder = await cloudinary.api.delete_folder(
//           "api/vinted/users"
//         );
//       } catch (error) {
//         console.log("deleteFolder error ===> ", error.message);
//       }

//       // Créer les users

//       // Admin User
//       try {
//         const token = uid2(64);
//         const salt = uid2(64);
//         const hash = SHA256("azerty" + salt).toString(encBase64);

//         const adminUser = new User({
//           email: "brice@lereacteur.io",
//           token: token,
//           hash: hash,
//           salt: salt,
//           account: {
//             username: "Brice",
//             phone: "0607080910",
//           },
//         });

//         // uploader la photo de profile de l'admin user
//         const resultImage = await cloudinary.uploader.upload(
//           faker.random.image(),
//           {
//             folder: `api/vinted/users/${adminUser._id}`,
//             public_id: "avatar",
//           }
//         );

//         adminUser.account.avatar = resultImage;
//         // sauvegarder l'admin user dans la BDD
//         await adminUser.save();
//       } catch (error) {
//         res
//           .status(404)
//           .json({ error: "Error when creating admin user : " + error.message });
//       }

//       // Random Users
//       for (let i = 0; i < owners.length; i++) {
//         try {
//           // Étape 1 : encrypter le mot de passe
//           // Générer le token et encrypter le mot de passe
//           const token = uid2(64);
//           const salt = uid2(64);
//           const hash = SHA256("azerty" + salt).toString(encBase64);

//           // Étape 2 : créer le nouvel utilisateur
//           const newUser = new User({
//             email: faker.internet.email().toLowerCase(),
//             token: token,
//             hash: hash,
//             salt: salt,
//             account: {
//               username: owners[i].owner_name || faker.internet.userName(),
//               phone: faker.phone.phoneNumber("06########"),
//             },
//           });

//           // Étape 3 : uploader la photo de profile du user
//           const resultImage = await cloudinary.uploader.upload(
//             owners[i].owner_image || faker.random.image(),
//             {
//               folder: `api/vinted/users/${newUser._id}`,
//               public_id: "avatar",
//             }
//           );

//           newUser.account.avatar = resultImage;
//           // Étape 3 : sauvegarder ce nouvel utilisateur dans la BDD
//           await newUser.save();
//           console.log(`${i + 1} / ${owners.length} users saved`);
//         } catch (error) {
//           console.log(error.message);
//           res.status(400).json({ message: error.message });
//         }
//       }
//       res.status(200).json("🍺 All users saved !");
//     }
//   } else {
//     res.status(400).json({ error: "Unauthorized" });
//   }
// });

module.exports = router;
