const express = require("express")
const reconRoutes = require("./routes/reconRoutes")
const connectDB = require("./config/db")

const PORT = 3000
const app = express()


app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

connectDB()

app.listen(PORT, function () {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.use("/", reconRoutes)