import { evalCode, vars } from "../main"
import { number } from "../VarTypes";

describe("Cowscript", () => {

    it("JS Works", () => {
        expect(true).toBe(true);
    });

    it("Can work with variables", () => {
        evalCode("define hello number 10");
        expect(vars["hello"].type).toBe(number);
        expect(vars["hello"].value).toBe(10);
    })

})