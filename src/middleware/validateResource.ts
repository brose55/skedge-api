import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from 'express'
import logger from "../utils/logger";

// when a req comes in we will validate the req against the schema
const validateResource = (schema: AnyZodObject) => (req:Request, res:Response, next:NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    })
    next()
  } catch (err) {
    logger.error(err)
    res.status(400).send(err)
  }
}

export default validateResource