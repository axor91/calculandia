import CategoryPage, {
  createCategoryMetadata,
} from "../_components/CategoryPage";
const category = "data-i-vremya";
export const metadata = createCategoryMetadata(category);
export default function Page() {
  return <CategoryPage id={category} />;
}
