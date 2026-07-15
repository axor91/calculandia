import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("kredit");
export default function Page() {
  return <CalculatorPage slug="kredit" />;
}
