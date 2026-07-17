import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("shtukaturka");
export default function Page() {
  return <CalculatorPage slug="shtukaturka" />;
}
