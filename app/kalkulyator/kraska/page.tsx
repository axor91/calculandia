import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("kraska");
export default function Page() {
  return <CalculatorPage slug="kraska" />;
}
