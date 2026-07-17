import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("kirpich");
export default function Page() {
  return <CalculatorPage slug="kirpich" />;
}
