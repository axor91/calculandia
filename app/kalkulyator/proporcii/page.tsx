import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("proporcii");
export default function Page() {
  return <CalculatorPage slug="proporcii" />;
}
