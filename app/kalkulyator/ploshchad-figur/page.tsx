import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("ploshchad-figur");
export default function Page() {
  return <CalculatorPage slug="ploshchad-figur" />;
}
