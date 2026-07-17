import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("laminat");
export default function Page() {
  return <CalculatorPage slug="laminat" />;
}
