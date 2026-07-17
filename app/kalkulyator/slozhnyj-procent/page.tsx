import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("slozhnyj-procent");
export default function Page() {
  return <CalculatorPage slug="slozhnyj-procent" />;
}
