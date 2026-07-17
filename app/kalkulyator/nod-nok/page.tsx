import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("nod-nok");
export default function Page() {
  return <CalculatorPage slug="nod-nok" />;
}
