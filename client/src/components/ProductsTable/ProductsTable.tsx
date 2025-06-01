import React from "react";
import { ProductItem } from "@/types";
import { Filters, SortDirection } from "@/hooks/useSearchResults";
import s from "./s.module.scss";

interface ProductsTableProps {
  products: ProductItem[];
  isLoading: boolean;
  filters: Filters;
  onSortChange: (
    field: keyof Filters,
    direction: SortDirection | undefined
  ) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  isLoading,
  filters,
  onSortChange,
}) => {
  const getWildberriesUrl = (externalId: number) => {
    return `https://www.wildberries.ru/catalog/${externalId}/detail.aspx`;
  };

  const handleOpenProductPage = (externalId: number) => {
    window.open(getWildberriesUrl(externalId), "_blank");
  };

  const handleHeaderClick = (field: keyof Filters) => {
    // Получаем текущее направление сортировки для поля
    const currentDirection = filters[field];

    // Определяем новое направление
    let newDirection: SortDirection | undefined;

    if (!currentDirection) {
      newDirection = "asc";
    } else if (currentDirection === "asc") {
      newDirection = "desc";
    } else {
      // Сбрасываем сортировку
      newDirection = undefined;
    }

    onSortChange(field, newDirection);
  };

  const renderSortIndicator = (field: keyof Filters) => {
    const direction = filters[field];
    if (!direction) return null;

    return (
      <span className={s.sortIndicator}>{direction === "asc" ? "↑" : "↓"}</span>
    );
  };

  const getSortableHeaderClass = (
    field: keyof Filters,
    columnClass?: string
  ) => {
    return `${s.headerCell} ${columnClass || ""} ${s.sortableHeader} ${
      filters[field] ? s.activeSortHeader : ""
    }`;
  };

  if (isLoading) {
    return <div className={s.loadingState}>Загрузка результатов...</div>;
  }

  if (products.length === 0) {
    return <div className={s.emptyState}>Нет результатов для отображения</div>;
  }

  return (
    <div className={s.tableContainer}>
      <table className={s.table}>
        <colgroup>
          <col className={s.colName} />
          <col className={s.colBrand} />
          <col className={s.colSupplier} />
          <col className={s.colRating} />
          <col className={s.colRating} />
          <col className={s.colFeedbacks} />
          <col className={s.colPrice} />
        </colgroup>
        <thead>
          <tr>
            <th
              className={getSortableHeaderClass("name", s.colName)}
              onClick={() => handleHeaderClick("name")}
            >
              Название{renderSortIndicator("name")}
            </th>
            <th
              className={getSortableHeaderClass("brand", s.colBrand)}
              onClick={() => handleHeaderClick("brand")}
            >
              Бренд{renderSortIndicator("brand")}
            </th>
            <th
              className={getSortableHeaderClass("supplier", s.colSupplier)}
              onClick={() => handleHeaderClick("supplier")}
            >
              Поставщик{renderSortIndicator("supplier")}
            </th>
            <th
              className={getSortableHeaderClass("supplierRating", s.colRating)}
              onClick={() => handleHeaderClick("supplierRating")}
            >
              Рейтинг
              <br />
              поставщика{renderSortIndicator("supplierRating")}
            </th>
            <th
              className={getSortableHeaderClass("reviewRating", s.colRating)}
              onClick={() => handleHeaderClick("reviewRating")}
            >
              Рейтинг
              <br />
              товара{renderSortIndicator("reviewRating")}
            </th>
            <th
              className={getSortableHeaderClass("feedbacks", s.colFeedbacks)}
              onClick={() => handleHeaderClick("feedbacks")}
            >
              Отзывы{renderSortIndicator("feedbacks")}
            </th>
            <th
              className={getSortableHeaderClass("price", s.colPrice)}
              onClick={() => handleHeaderClick("price")}
            >
              Цена ₽{renderSortIndicator("price")}
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className={s.tableRow}
              onClick={() => handleOpenProductPage(product.external_id)}
            >
              <td
                className={`${s.tableCell} ${s.colName} ${s.cellName}`}
                title={product.name}
              >
                {product.name}
              </td>
              <td
                className={`${s.tableCell} ${s.colBrand}`}
                title={product.brand || "—"}
              >
                {product.brand || "—"}
              </td>
              <td
                className={`${s.tableCell} ${s.colSupplier}`}
                title={product.supplier}
              >
                {product.supplier}
              </td>
              <td
                className={`${s.tableCell} ${s.colRating} ${s.cellRating}`}
                title={product.supplier_rating.toFixed(1)}
              >
                {product.supplier_rating.toFixed(1)}
              </td>
              <td
                className={`${s.tableCell} ${s.colRating} ${s.cellRating}`}
                title={product.review_rating.toFixed(1)}
              >
                {product.review_rating.toFixed(1)}
              </td>
              <td
                className={`${s.tableCell} ${s.colFeedbacks} ${s.cellFeedbacks}`}
                title={product.feedbacks.toString()}
              >
                {product.feedbacks}
              </td>
              <td
                className={`${s.tableCell} ${s.colPrice} ${s.cellPrice}`}
                title={product.price.toString()}
              >
                {product.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
