import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("beton");
export default function Page() {
  return <CalculatorPage slug="beton" />;
}
