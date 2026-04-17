import {type GetProps, Table} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-table.css";

export type AntDesignTableProps<T> = GetProps<typeof Table<T>>;

interface UiTableProps<T> extends AntDesignTableProps<T> {
	dontUseThisProp?: never;
}

const UiTable = <T,>(props: UiTableProps<T>) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Table<T> size="middle" scroll={{y: 55 * 10}} className={clsx("ui_table")} {...rest} />
		</Fragment>
	);
};

export default UiTable;
