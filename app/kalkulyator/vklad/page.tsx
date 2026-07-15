import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("vklad");
export default function Page() {
  return <CalculatorPage slug="vklad" />;
}
