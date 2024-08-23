import { Request, Response } from "express"
import {
	CreateInterestsInput,
	DeleteInterestInput,
} from "../schemas/InterestSchema"
import {
	findInterests,
	findInterest,
	createInterests,
	deleteInterest,
} from "../services/InterestServices"
import logger from "../utils/logger"

export async function getInterestsHandler(req: Request, res: Response) {
	const user = res.locals.user._id
	const interests = await findInterests({ user: user })

	if (!interests) {
		res.send([])
	}

	return res.send(interests)
}

export async function createInterestsHandler(
	req: Request<{}, {}, CreateInterestsInput["body"][]>,
	res: Response
) {
	const user = res.locals.user._id
	const updates: object[] = []
	req.body.forEach((interest) => {
		updates.push({ user, ...interest })
	})
	try {
		const interests = await createInterests({ user: user }, updates)
		return res.send(interests)
	} catch (err) {
		console.log(err)
	}
}

export async function deleteInterestHandler(
	req: Request<DeleteInterestInput["params"]>,
	res: Response
) {
	const userId = res.locals.user._id
	const interestId = req.params.interestId
	const interest = await findInterest({ interestId })

	if (!interest) {
		return res.status(404)
	}

	if (String(interest.userId) !== userId) {
		return res.status(403)
	}

	await deleteInterest({ _id: interestId })

	return res.sendStatus(200)
}
