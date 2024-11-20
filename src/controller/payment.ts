import { Payment } from "../entities";
import { Controller } from "./base";

export class PaymentController extends Controller<Payment>{
    constructor(){
        super(Payment)
    }
}