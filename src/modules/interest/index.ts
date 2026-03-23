export type {
  PublicInterestDTO,
  NewInterest,
  Priority,
} from "./domain/interest.dto";
export type { IInterestRepository } from "./domain/interest.repo";
export { interestRouter } from "./http/interest.routes";
export { interestRepository } from "./infra/interest.repo.mongo";
export { makeInterestService } from "./app/interest.service";
export { interestService } from "./app/interest.service.instance";
