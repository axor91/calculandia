import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("den-nedeli");
export default function Page() {
  return <CalculatorPage slug="den-nedeli" />;
}
