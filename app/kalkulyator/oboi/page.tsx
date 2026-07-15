import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("oboi");
export default function Page() {
  return <CalculatorPage slug="oboi" />;
}
