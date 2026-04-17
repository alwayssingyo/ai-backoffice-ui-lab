import assert from "node:assert/strict";
import test from "node:test";
import type {ContentFolderNodeResponse} from "@/services/types/content-folder-node-response.ts";
import type {ContentTypeColumnResponse} from "@/services/types/content-type-column-response.ts";
import {contentTypeColumnResponseFieldTypeEnum} from "@/services/types/content-type-column-response.ts";
import {
	buildFilterUpsertPayload,
	getFilterFieldCompatibility,
	isSameFilterDraftTableState,
	mapSavedFilterIdsByField,
	resolveSelectedFilterTableState,
	selectFilterTreeDataFromApi,
	setFilterDraftComponent,
	setFilterDraftEnabled,
	setFilterDraftItems,
	setFilterDraftLabel,
	setFilterDraftOperator,
	toFilterDraftTableStateFromFilters,
	toFilterColumnRows,
	type FilterDraftState,
} from "./filter.ts";

test("TEXT와 JSON 컬럼의 compatibility matrix를 결정론적으로 반환한다", () => {
	const textCompatibility = getFilterFieldCompatibility(contentTypeColumnResponseFieldTypeEnum.TEXT);
	const jsonCompatibility = getFilterFieldCompatibility(contentTypeColumnResponseFieldTypeEnum.JSON);

	assert.equal(textCompatibility.supported, true);
	assert.deepEqual(textCompatibility.operators, ["eq", "ne", "contains", "startsWith", "endsWith", "in", "notIn"]);
	assert.deepEqual(textCompatibility.components, ["text"]);

	assert.equal(jsonCompatibility.supported, false);
	assert.equal(jsonCompatibility.operators.length, 0);
	assert.equal(jsonCompatibility.components.length, 0);
	assert.match(jsonCompatibility.unsupportedReason ?? "", /JSON/);
});

test("content folder tree 응답에서 유효한 TABLE만 선택 대상으로 추출하고 invalid search는 첫 TABLE로 fallback 한다", () => {
	const nodes = [
		{
			id: 1,
			parentId: undefined,
			nodeType: "FOLDER",
			name: "Catalog",
			orderNumber: 1,
			displayed: true,
			children: [
				{
					id: 2,
					parentId: 1,
					nodeType: "TABLE",
					name: "Products",
					tableName: "products",
					orderNumber: 1,
					displayed: true,
					children: undefined,
				},
				{id: 3, parentId: 1, nodeType: "TABLE", name: "Broken", tableName: "", orderNumber: 2, displayed: true, children: undefined},
			] as unknown as ContentFolderNodeResponse,
		},
	] satisfies ContentFolderNodeResponse[];

	const treeData = selectFilterTreeDataFromApi(nodes);
	const selectedState = resolveSelectedFilterTableState(treeData.tableNodes, "missing_table");

	assert.equal(treeData.sidebarNodes.length, 1);
	assert.equal(treeData.tableNodes.length, 1);
	assert.equal(treeData.hasInvalidNode, true);
	assert.equal(selectedState.selectedTableName, "products");
	assert.equal(selectedState.hasSelectedTable, true);
});

test("draft state는 supported 컬럼만 활성화하고 disable 시 operator와 component를 비운다", () => {
	const textColumn = {
		name: "title",
		ordinalPosition: 1,
		columnType: "varchar",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	const jsonColumn = {
		name: "metadata",
		ordinalPosition: 2,
		columnType: "json",
		fieldType: contentTypeColumnResponseFieldTypeEnum.JSON,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;

	let draftState: FilterDraftState = {};

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "title", enabled: true, supported: true});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "title",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		operators: ["contains"],
		allowedOperators: ["eq", "ne", "contains", "startsWith", "endsWith", "in", "notIn"],
	});
	draftState = setFilterDraftComponent(draftState, {
		tableName: "products",
		columnName: "title",
		component: "text",
		allowedComponents: ["text"],
	});

	const configuredRows = toFilterColumnRows([textColumn, jsonColumn], draftState.products);
	assert.equal(configuredRows[0]?.enabled, true);
	assert.equal(configuredRows[0]?.label, "");
	assert.deepEqual(configuredRows[0]?.operators, ["contains"]);
	assert.equal(configuredRows[0]?.component, "text");
	assert.equal(configuredRows[0]?.status.tone, "active");
	assert.equal(configuredRows[0]?.canSave, true);
	assert.equal(configuredRows[1]?.enabled, false);
	assert.equal(configuredRows[1]?.status.tone, "unsupported");

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "metadata", enabled: true, supported: false});
	assert.equal(draftState.products?.metadata, undefined);

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "title", enabled: false, supported: true});

	const disabledRows = toFilterColumnRows([textColumn], draftState.products);
	assert.equal(disabledRows[0]?.enabled, false);
	assert.deepEqual(disabledRows[0]?.operators, []);
	assert.equal(disabledRows[0]?.component, undefined);
	assert.equal(disabledRows[0]?.status.tone, "idle");
	assert.equal(disabledRows[0]?.canSave, false);
});

test("저장된 필터 id 맵과 upsert payload를 현재 row 기준으로 생성한다", () => {
	const savedFilterIdsByField = mapSavedFilterIdsByField([
		{
			id: 7,
			table: "products",
			field: "title",
			label: "title",
			dataType: "varchar",
			operator: "contains",
			component: "text",
			creatorId: 1,
			createdAt: "2025-01-01T00:00:00.000Z",
		},
	]);

	assert.deepEqual(savedFilterIdsByField, {title: 7});

	const payload = buildFilterUpsertPayload({
		tableName: "products",
		savedFilterId: savedFilterIdsByField.title,
		row: {
			key: "title",
			name: "title",
			label: "제목",
			items: "",
			fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
			columnType: "varchar",
			ordinalPosition: 1,
			supported: true,
			supportedOperators: ["eq", "contains"],
			supportedComponents: ["text"],
			canEditItems: false,
			enabled: true,
			operators: ["contains"],
			component: "text",
			status: {label: "초안 구성 완료", tone: "active"},
			hasChanges: true,
			canSave: true,
		},
	});

	assert.deepEqual(payload, {
		id: 7,
		table: "products",
		field: "title",
		label: "제목",
		dataType: "TEXT",
		operator: "contains",
		component: "text",
		items: undefined,
	});
});

test("저장된 필터 목록을 현재 테이블 draft 상태로 변환한다", () => {
	const draftTableState = toFilterDraftTableStateFromFilters({
		tableName: "products",
		filters: [
			{
				id: 7,
				table: "products",
				field: "title",
				label: "title",
				dataType: "TEXT",
				operator: "contains",
				component: "text",
				items: [{label: "공개", value: "public"}],
				creatorId: 1,
				createdAt: "2025-01-01T00:00:00.000Z",
			},
		],
	});

	assert.deepEqual(draftTableState, {
		title: {
			tableName: "products",
			columnName: "title",
			label: "title",
			items: "공개:public",
			enabled: true,
			operators: ["contains"],
			component: "text",
		},
	});
	assert.equal(
		isSameFilterDraftTableState(draftTableState, {
			title: {
				tableName: "products",
				columnName: "title",
				label: "title",
				items: "공개:public",
				enabled: true,
				operators: ["contains"],
				component: "text",
			},
		}),
		true,
	);
});

test("label 표시이름은 화면에서 원문을 유지하고 저장 시 비어 있으면 컬럼명으로 fallback 한다", () => {
	const textColumn = {
		name: "title",
		ordinalPosition: 1,
		columnType: "varchar",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	let draftState: FilterDraftState = {};

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "title", enabled: true, supported: true});
	draftState = setFilterDraftLabel(draftState, {tableName: "products", columnName: "title", label: "제목"});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "title",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		operators: ["contains"],
		allowedOperators: ["eq", "ne", "contains", "startsWith", "endsWith", "in", "notIn"],
	});
	draftState = setFilterDraftComponent(draftState, {
		tableName: "products",
		columnName: "title",
		component: "text",
		allowedComponents: ["text"],
	});

	let rows = toFilterColumnRows([textColumn], draftState.products);
	assert.equal(rows[0]?.label, "제목");

	let payload = buildFilterUpsertPayload({tableName: "products", row: rows[0]!});
	assert.equal(payload.label, "제목");

	draftState = setFilterDraftLabel(draftState, {tableName: "products", columnName: "title", label: "   "});
	rows = toFilterColumnRows([textColumn], draftState.products);
	assert.equal(rows[0]?.label, "   ");

	payload = buildFilterUpsertPayload({tableName: "products", row: rows[0]!});
	assert.equal(payload.label, "   ");
});

test("label 표시이름이 빈 문자열이면 저장 payload는 컬럼명으로 fallback 한다", () => {
	const payload = buildFilterUpsertPayload({
		tableName: "products",
		row: {
			key: "title",
			name: "title",
			label: "",
			items: "",
			fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
			columnType: "varchar",
			ordinalPosition: 1,
			supported: true,
			supportedOperators: ["contains"],
			supportedComponents: ["text"],
			canEditItems: false,
			enabled: true,
			operators: ["contains"],
			component: "text",
			status: {label: "초안 구성 완료", tone: "active"},
			hasChanges: true,
			canSave: true,
		},
	});

	assert.equal(payload.label, "title");
});

test("기존 저장 데이터와 동일하면 변경사항 없음 상태가 되고 저장 버튼이 비활성화된다", () => {
	const textColumn = {
		name: "title",
		ordinalPosition: 1,
		columnType: "varchar",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	const savedFilters = [
		{
			id: 7,
			table: "products",
			field: "title",
			label: "title",
			dataType: "TEXT",
			operator: "contains",
			component: "text",
			creatorId: 1,
			createdAt: "2025-01-01T00:00:00.000Z",
		},
	];
	const rows = toFilterColumnRows([textColumn], toFilterDraftTableStateFromFilters({tableName: "products", filters: savedFilters}), {
		title: savedFilters,
	});

	assert.equal(rows[0]?.status.tone, "unchanged");
	assert.equal(rows[0]?.status.label, "변경사항 없음");
	assert.equal(rows[0]?.canSave, false);
});

test("기존 저장 데이터를 사용 안 함으로 바꾸면 저장 버튼이 활성화된다", () => {
	const textColumn = {
		name: "title",
		ordinalPosition: 1,
		columnType: "varchar",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	let draftState = toFilterDraftTableStateFromFilters({
		tableName: "products",
		filters: [
			{
				id: 7,
				table: "products",
				field: "title",
				label: "title",
				dataType: "TEXT",
				operator: "contains",
				component: "text",
				creatorId: 1,
				createdAt: "2025-01-01T00:00:00.000Z",
			},
		],
	});

	draftState =
		setFilterDraftEnabled({products: draftState}, {tableName: "products", columnName: "title", enabled: false, supported: true}).products ??
		{};

	const rows = toFilterColumnRows([textColumn], draftState, {
		title: [
			{
				id: 7,
				table: "products",
				field: "title",
				label: "title",
				dataType: "TEXT",
				operator: "contains",
				component: "text",
				creatorId: 1,
				createdAt: "2025-01-01T00:00:00.000Z",
			},
		],
	});

	assert.equal(rows[0]?.status.tone, "idle");
	assert.equal(rows[0]?.canSave, true);
});

test("ENUMERATION 컬럼은 eq/ne일 때 radio/select/text, in/notIn일 때 checkbox/select/text만 허용한다", () => {
	const enumColumn = {
		name: "status",
		ordinalPosition: 1,
		columnType: "varchar",
		fieldType: contentTypeColumnResponseFieldTypeEnum.ENUMERATION,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	let draftState: FilterDraftState = {};

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "status", enabled: true, supported: true});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "status",
		operators: ["eq"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.ENUMERATION,
		allowedOperators: ["eq", "ne", "in", "notIn"],
	});
	let rows = toFilterColumnRows([enumColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["radio", "select", "text"]);

	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "status",
		operators: ["ne"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.ENUMERATION,
		allowedOperators: ["eq", "ne", "in", "notIn"],
	});
	rows = toFilterColumnRows([enumColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["radio", "select", "text"]);

	draftState = setFilterDraftComponent(draftState, {
		tableName: "products",
		columnName: "status",
		component: "radio",
		allowedComponents: ["radio", "select", "text"],
	});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "status",
		operators: ["in"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.ENUMERATION,
		allowedOperators: ["eq", "ne", "in", "notIn"],
	});
	rows = toFilterColumnRows([enumColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["checkbox", "select", "text"]);
	assert.equal(rows[0]?.component, undefined);
});

test("TEXT 컬럼은 in/notIn에서 checkbox/select/text를 허용하고 eq/ne에서 radio를 허용한다", () => {
	const textColumn = {
		name: "title",
		ordinalPosition: 1,
		columnType: "varchar",
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	let draftState: FilterDraftState = {};

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "title", enabled: true, supported: true});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "title",
		operators: ["eq"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		allowedOperators: ["eq", "ne", "contains", "startsWith", "endsWith", "in", "notIn"],
	});

	let rows = toFilterColumnRows([textColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["radio", "text"]);

	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "title",
		operators: ["in"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
		allowedOperators: ["eq", "ne", "contains", "startsWith", "endsWith", "in", "notIn"],
	});
	rows = toFilterColumnRows([textColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["checkbox", "text", "select"]);
});

test("NUMBER와 DATE 컬럼은 eq/ne에서 radio를 허용한다", () => {
	const numberColumn = {
		name: "priority",
		ordinalPosition: 1,
		columnType: "int",
		fieldType: contentTypeColumnResponseFieldTypeEnum.NUMBER,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	const dateColumn = {
		name: "created_at",
		ordinalPosition: 2,
		columnType: "timestamp",
		fieldType: contentTypeColumnResponseFieldTypeEnum.DATE,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	let draftState: FilterDraftState = {};

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "priority", enabled: true, supported: true});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "priority",
		operators: ["eq"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.NUMBER,
		allowedOperators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "in", "notIn"],
	});

	let rows = toFilterColumnRows([numberColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["radio", "text"]);

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "created_at", enabled: true, supported: true});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "created_at",
		operators: ["ne"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.DATE,
		allowedOperators: ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
	});

	rows = toFilterColumnRows([dateColumn], draftState.products);
	assert.deepEqual(rows[0]?.supportedComponents, ["radio", "datetime"]);
});

test("items는 비 ENUMERATION 이면서 select/radio/checkbox component일 때만 편집 가능하고 저장 payload에 포함된다", () => {
	const numberColumn = {
		name: "priority",
		ordinalPosition: 1,
		columnType: "int",
		fieldType: contentTypeColumnResponseFieldTypeEnum.NUMBER,
		required: false,
		privateField: false,
	} satisfies ContentTypeColumnResponse;
	let draftState: FilterDraftState = {};

	draftState = setFilterDraftEnabled(draftState, {tableName: "products", columnName: "priority", enabled: true, supported: true});
	draftState = setFilterDraftOperator(draftState, {
		tableName: "products",
		columnName: "priority",
		operators: ["eq"],
		fieldType: contentTypeColumnResponseFieldTypeEnum.NUMBER,
		allowedOperators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "in", "notIn"],
	});
	draftState = setFilterDraftComponent(draftState, {
		tableName: "products",
		columnName: "priority",
		component: "text",
		allowedComponents: ["radio", "select", "checkbox", "text"],
	});

	let rows = toFilterColumnRows([numberColumn], draftState.products);
	assert.equal(rows[0]?.canEditItems, false);

	draftState = setFilterDraftComponent(draftState, {
		tableName: "products",
		columnName: "priority",
		component: "select",
		allowedComponents: ["radio", "select", "checkbox", "text"],
	});
	draftState = setFilterDraftItems(draftState, {tableName: "products", columnName: "priority", items: "낮음:1, 높음:2"});

	rows = toFilterColumnRows([numberColumn], draftState.products);
	assert.equal(rows[0]?.canEditItems, true);
	assert.equal(rows[0]?.items, "낮음:1, 높음:2");

	const payload = buildFilterUpsertPayload({tableName: "products", row: rows[0]!});
	assert.equal(payload.items, "낮음:1, 높음:2");
});
