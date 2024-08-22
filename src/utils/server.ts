import express from "express"
import cors from "cors"
import deserializeUser from "../middleware/deserializeUser"
import router from "../routes"
import config from "config"
import cookieParser from "cookie-parser"

function createServer() {
	const app = express()

	app.use(
		cors({
			origin: config.get("origin"),
			credentials: true,
		})
	)

	app.use(cookieParser())

	app.use(express.json())

	app.use(deserializeUser)

	app.use(router)

	return app
}

export default createServer
