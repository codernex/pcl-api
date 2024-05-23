import { Contacts, PaymentDetails } from "../entities";
import { Controller } from "./base";
import { ApiError, requestHandler } from "../utils";

export class ContactController extends Controller<Contacts> {
  constructor() {
    super(Contacts);
  }

  createContact = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "name", "mobile");
        // Handling Error

        // Seller Payment Option
        const paymentDetails = new PaymentDetails();

        Object.assign(paymentDetails, {
          ...req.body,
        });

        const contact = new Contacts();

        if (!req.body.credit_limit) {
          contact.credit_limit = 0;
        }
        contact.payment = paymentDetails;
        Object.assign(contact, {
          ...req.body,
        });

        await this.repository.save(contact);

        return this.success(res, contact, 201);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getContacts = requestHandler(async (req, res, next) => {
    try {
      const contacts = await this.repository.find({
        relations: {
          payment: true,
          payment_option: true,
        },
      });

      return this.success(res, contacts);
    } catch (err) {
      return ApiError(err, 500, next);
    }
  });
}
