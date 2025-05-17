import React, { memo, useState } from "react";
import { useTable, usePagination, useSortBy, useFilters } from "react-table";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Tooltip,
  IconButton,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  NumberInput,
  Select,
  Text,
  TableCaption,
} from "@chakra-ui/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";
import { equals } from "equality-comparison";
import { TableContainer } from "@chakra-ui/react";
function ReactTable({
  columns,
  data,
  onlyNavigatores,
  selectableRow,
  onSelectRow,
  defaultPageSize,
  fontSize,
  isHeadFixed,
  isDrag,
  variant
}: any) {
  // Use the state and functions returned from useTable to build your UI
  const [selectedRow, setSelectedRow] = useState(-1);
  const [tableData, setTableData] = useState("")
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    //@ts-ignore
    page, // Instead of using 'rows', we'll use page,
    // which has only the rows for the active page

    // The rest of these things are super handy, too ;)
    //@ts-ignore
    canPreviousPage,
    //@ts-ignore
    canNextPage,
    //@ts-ignore
    pageOptions,
    //@ts-ignore
    pageCount,
    //@ts-ignore
    gotoPage,
    //@ts-ignore
    nextPage,
    //@ts-ignore
    previousPage,
    //@ts-ignore
    setPageSize,
    //@ts-ignore
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        //@ts-ignore
        pageIndex: 0,
        pageSize: defaultPageSize ? defaultPageSize : 5,
      },
    },
    useSortBy,
    usePagination,
  );
  let totalColumnWith = 0;
  if (columns) {
    columns.forEach((column: any) => {
      if (column.columnWidth) totalColumnWith += column.columnWidth;
    });
  }



  // Render the UI for your table
  return (
    <>
      <TableContainer>
        <Table
          {...getTableProps()}
          fontSize={fontSize}
          position={isHeadFixed ? "relative" : undefined} variant={variant ? variant : "striped"}
        >
          <TableCaption>
            {data.length} Registro{data.length > 1 ? "s" : ""} Encontrado
            {data.length > 1 ? "s" : ""}.
          </TableCaption>
          <Thead
            backgroundColor={isHeadFixed ? "white" : undefined}
            shadow="sm"
            position={isHeadFixed ? "sticky" : undefined}
            top={isHeadFixed ? 0 : undefined}
          >
            {headerGroups.map((headerGroup: any) => (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any,i:any) => {
                  //@ts-ignore
                  let sortProps = column.getSortByToggleProps();
                  sortProps.title = "Ordenar por";
                  return (
                    //@ts-ignore
                    <Th
                    key={i+"ThF"}
                      {...column.getHeaderProps(sortProps)}
                      width={
                        column.columnWidth
                          ? (
                            (column.columnWidth / totalColumnWith) *
                            100
                          ).toFixed(0) + "%"
                          : null
                      }
                    >
                      {column.render("Header")}
                      {/* Add a sort direction indicator */}
                      <span>
                        {" "}
                        {
                          //@ts-ignore
                          column.isSorted ? (
                            //@ts-ignore
                            column.isSortedDesc ? (
                              <TriangleDownIcon aria-label="sorted descending" />
                            ) : (
                              <TriangleUpIcon aria-label="sorted ascending" />
                            )
                          ) : (
                            ""
                          )
                        }
                      </span>
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()} h={"100px"} overflow="auto">
            {page.map((row: any, i: number) => {
              prepareRow(row);
              return (
                <Tr
                  {...row.getRowProps()} 
                  key={i+"tr"}
                  bg={row === selectedRow ? "blue.400" : null}
                  color={row === selectedRow ? "white" : null}
                  onClick={
                    selectableRow
                      ? () => {
                        setSelectedRow(row);
                        if (onSelectRow) onSelectRow(row);
                      }
                      : () => { }
                  }
                >
                  {row.cells.map((cell: any, i: number) => {
                    return (
                      <Td
                        key={i+"td"}
                        padding={"2"}
                        textOverflow={"ellipsis"}
                        overflow={"hidden"}
                        whiteSpace={columns[i].ellipSizeMode ? "nowrap" : null}
                        maxWidth={columns[i].ellipSizeMode ? 0 : "auto"}
                        {...cell.getCellProps()}
                      >
                        {cell.render("Cell")}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>

      {/* 
        Pagination can be built however you'd like. 
        This is just a very basic UI implementation:
      */}
      {data.length > 0 ? (
        <Flex justifyContent="space-between" m={4} alignItems="center">
          <Flex>
            {onlyNavigatores ? null : (
              <Tooltip label="Primeira Página">
                <IconButton
                  onClick={() => {
                    gotoPage(0);
                  }}
                  isDisabled={pageIndex === 0}
                  icon={<ArrowLeftIcon h={3} w={3} />}
                  mr={4}
                  aria-label={""}
                />
              </Tooltip>
            )}
            <Tooltip label="Anterior">
              <IconButton
                onClick={() => gotoPage(pageIndex - 1)}
                isDisabled={!canPreviousPage}
                icon={<ChevronLeftIcon h={6} w={6} />}
                aria-label={""}
              />
            </Tooltip>
          </Flex>

          {onlyNavigatores ? null : (
            <Flex alignItems="center">
              {/* @ts-ignore */}
              <Text flexShrink="0" mr={8}>
                Página{" "}
                <Text fontWeight="bold" as="span">
                  {pageIndex + 1}
                </Text>{" "}
                of{" "}
                <Text fontWeight="bold" as="span">
                  {pageCount}
                </Text>
              </Text>
              {/* @ts-ignore */}
              <Text flexShrink="0">Ir para:</Text>{" "}
              <NumberInput
                ml={2}
                mr={8}
                w={28}
                min={1}
                max={pageCount}
                onChange={(value) => {
                  //@ts-ignore
                  const page = value ? value - 1 : 0;
                  gotoPage(page);
                }}
                value={pageIndex + 1}
                defaultValue={1}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Select
                width="36"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
              >
                {[5, 10, 15, 20].map((sizesPage) => (
                  <option key={sizesPage} value={sizesPage}>
                    Mostrar {sizesPage}
                  </option>
                ))}
              </Select>
            </Flex>
          )}

          <Flex>
            <Tooltip label="Próxima">
              <IconButton
                onClick={() => {
                  gotoPage(pageIndex + 1);
                }}
                isDisabled={!canNextPage}
                icon={<ChevronRightIcon h={6} w={6} />}
                aria-label={""}
              />
            </Tooltip>
            {onlyNavigatores ? null : (
              <Tooltip label="Última Página">
                <IconButton
                  onClick={() => {
                    gotoPage(pageCount - 1);
                  }}
                  isDisabled={pageIndex >= pageCount - 1}
                  icon={<ArrowRightIcon h={3} w={3} />}
                  ml={4}
                  aria-label={""}
                />
              </Tooltip>
            )}
          </Flex>
        </Flex>
      ) : null}
    </>
  );
}

export type DataTableHeaders = {
  Header: string;
  accessor: string;
  isNumeric?: boolean;
  columnWidth?: number;
  ellipSizeMode?: boolean;
  isDate?: boolean;
  isDateTime?: boolean;
};

type IProps = {
  isDrag?: any,
  columns: DataTableHeaders[];
  data: any[];
  onlyNavigatores?: boolean;
  selectableRow?: boolean;
  onSelectRow?: (row: any) => any;
  defaultPageSize?: number;
  fontSize?: string | number;
  isHeadFixed?: boolean;
  variant?: string;
};

export const DataTable = function App(props: IProps) {

  return (
    <ReactTable suppressHydrationWarning
      isDrag={props.isDrag}
      isHeadFixed={props.isHeadFixed}
      columns={props.columns}
      variant={props.variant}
      data={props.data}
      onlyNavigatores={props.onlyNavigatores}
      selectableRow={props.selectableRow}
      onSelectRow={props.onSelectRow}
      defaultPageSize={props.defaultPageSize}
      fontSize={props.fontSize}
    />
  );
};
