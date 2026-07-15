import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";

const slug = "percent-diff";

export const metadata = createCalculatorMetadata(slug);

export default function Page() {
  return <CalculatorPage slug={slug} />;
}
