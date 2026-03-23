import { interestRepository } from "../infra/interest.repo.mongo";
import { makeInterestService } from "./interest.service";

export const interestService = makeInterestService(interestRepository);
