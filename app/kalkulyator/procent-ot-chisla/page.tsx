import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("procent-ot-chisla");
export default function Page() {
  return <CalculatorPage slug="procent-ot-chisla" />;
}
