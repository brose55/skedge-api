import mongoose from "mongoose";
import config from "config";
import logger from "./logger";

async function connection() {
	const dbUri = config.get<string>("dbUri");

	try {
		await mongoose.connect(dbUri);
		logger.info("you are connected to the db");
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
}

export default connection;
