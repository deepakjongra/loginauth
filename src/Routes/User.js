const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const pool = require("../Config/DataBaseConfig");
const authenticateToken = require("../Middleware/Authentication");

router.get("/allusers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("select * from users");
    res.status(201).send(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong");
  }
});

// register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkUsername = await pool.query(
      "Select * from users where username = $1",
      [username]
    );
    if (checkUsername.rows.length > 0) {
      res.status(500).json({ error: "Username already exists" });
    } else {
      // insert new user into database
      const result = await pool.query(
        "INSERT INTO users (user_id, username, password) VALUES (uuid_generate_v4(), $1, $2) RETURNING user_id, username",
        [username, hashedPassword]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

// login and get JWT token
router.post("/login", async (req, res) => {
  try {
    // Destructure the username and password from the request body
    const { username, password } = req.body;

    // Check if the username or password is missing
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Retrieve the user from the database
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    // Check if the user exists
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Incorrect username or password" });
    }

    // Compare the user's hashed password with the password they entered
    const isPasswordValid = await bcrypt.compare(
      password,
      result.rows[0].password
    );

    // Check if the password is valid
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Incorrect username or password" });
    }

    // Generate a JWT containing the user ID and username
    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    pool.query("UPDATE users SET auth_token = $1 where user_id = $2", [
      token,
      result.rows[0].user_id,
    ]);
    // Send the token in the response
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// logout and delete JWT token from database
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    // delete JWT token from database
    await pool.query("UPDATE users SET auth_token = null WHERE user_id = $1", [
      user_id,
    ]);

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send("error updating");
  }
});

//updating the user password authentication required
router.put("/update/:user_id", authenticateToken, async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2 RETURNING user_id, username",
      [hashedPassword, user_id]
    );

    res.status(201).json(updated.rows[0]);
  } catch (err) {
    res.status(500).send("something went wrong");
  }
});

//deleteing the user accout with user_id
router.delete("/delete/:user_id", authenticateToken, async (req, res) => {
  try {
    const user_id = req.params.user_id;

    await pool.query("DELETE from users WHERE user_id = $1", [user_id]);
    res.status(201).send("User Deleted Successfully");
  } catch (err) {
    res.status(500).send("Something Went Wrong");
  }
});

module.exports = router;
