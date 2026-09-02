import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Table } from '../../tables/table.entity';
import { DbColumn } from '../../columns/column.entity';
import { Constraint } from '../../constraints/constraint.entity';
import { ConstraintColumn } from '../../constraints/constraint-column.entity';
import { ConstraintType } from '../../constraints/constraint-type.enum';

@Injectable()
export class SchemaContextTool {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,

    @InjectRepository(DbColumn)
    private readonly columnRepository: Repository<DbColumn>,

    @InjectRepository(Constraint)
    private readonly constraintRepository: Repository<Constraint>,

    @InjectRepository(ConstraintColumn)
    private readonly constraintColumnRepository: Repository<ConstraintColumn>,
  ) {}

  async build(projectId: string): Promise<string> {
    const tables = await this.tableRepository.find({
      where: {
        projectId,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    if (tables.length === 0) {
      return `
CURRENT PROJECT SCHEMA

The project currently contains no tables.
`.trim();
    }

    const tableIds = tables.map(
      (table) => table.id,
    );

    const columns = await this.columnRepository.find({
      where: {
        tableId: In(tableIds),
      },
      order: {
        position: 'ASC',
      },
    });

    const constraints = await this.constraintRepository.find({
      where: {
        tableId: In(tableIds),
      },
    });

    const constraintIds = constraints.map(
      (constraint) => constraint.id,
    );

    const constraintColumns =
      constraintIds.length > 0
        ? await this.constraintColumnRepository.find({
            where: {
              constraintId: In(constraintIds),
            },
            order: {
              position: 'ASC',
            },
          })
        : [];

    const tableById = new Map(
      tables.map((table) => [
        table.id,
        table,
      ]),
    );

    const columnById = new Map(
      columns.map((column) => [
        column.id,
        column,
      ]),
    );

    const columnsByTableId = new Map<
      string,
      DbColumn[]
    >();

    for (const column of columns) {
      const tableColumns =
        columnsByTableId.get(
          column.tableId,
        ) ?? [];

      tableColumns.push(column);

      columnsByTableId.set(
        column.tableId,
        tableColumns,
      );
    }

    const constraintsByTableId = new Map<
      string,
      Constraint[]
    >();

    for (const constraint of constraints) {
      const tableConstraints =
        constraintsByTableId.get(
          constraint.tableId,
        ) ?? [];

      tableConstraints.push(
        constraint,
      );

      constraintsByTableId.set(
        constraint.tableId,
        tableConstraints,
      );
    }

    const constraintColumnsByConstraintId =
      new Map<
        string,
        ConstraintColumn[]
      >();

    for (
      const constraintColumn of constraintColumns
    ) {
      const mappings =
        constraintColumnsByConstraintId.get(
          constraintColumn.constraintId,
        ) ?? [];

      mappings.push(
        constraintColumn,
      );

      constraintColumnsByConstraintId.set(
        constraintColumn.constraintId,
        mappings,
      );
    }

    const result: string[] = [
      'CURRENT PROJECT SCHEMA',
      '',
    ];

    for (const table of tables) {
      result.push(
        `TABLE: ${table.name}`,
      );

      const tableColumns =
        columnsByTableId.get(
          table.id,
        ) ?? [];

      result.push('Columns:');

      if (tableColumns.length === 0) {
        result.push('- none');
      } else {
        for (const column of tableColumns) {
          result.push(
            `- ${this.formatColumn(column)}`,
          );
        }
      }

      const tableConstraints =
        constraintsByTableId.get(
          table.id,
        ) ?? [];

      const primaryKeys =
        tableConstraints.filter(
          (constraint) =>
            constraint.type ===
            ConstraintType.PRIMARY_KEY,
        );

      if (primaryKeys.length > 0) {
        result.push(
          'Primary key:',
        );

        for (const primaryKey of primaryKeys) {
          const mappings =
            constraintColumnsByConstraintId.get(
              primaryKey.id,
            ) ?? [];

          const columnNames =
            mappings
              .map(
                (mapping) =>
                  columnById.get(
                    mapping.columnId,
                  )?.name,
              )
              .filter(
                (
                  name,
                ): name is string =>
                  Boolean(name),
              );

          result.push(
            `- ${columnNames.join(', ')}`,
          );
        }
      }

      const foreignKeys =
        tableConstraints.filter(
          (constraint) =>
            constraint.type ===
            ConstraintType.FOREIGN_KEY,
        );

      if (foreignKeys.length > 0) {
        result.push(
          'Foreign keys:',
        );

        for (const foreignKey of foreignKeys) {
          const referencedTable =
            foreignKey.referencedTableId
              ? tableById.get(
                  foreignKey.referencedTableId,
                )
              : undefined;

          const mappings =
            constraintColumnsByConstraintId.get(
              foreignKey.id,
            ) ?? [];

          for (const mapping of mappings) {
            const localColumn =
              columnById.get(
                mapping.columnId,
              );

            const referencedColumn =
              mapping.referencedColumnId
                ? columnById.get(
                    mapping.referencedColumnId,
                  )
                : undefined;

            if (
              !localColumn ||
              !referencedTable ||
              !referencedColumn
            ) {
              continue;
            }

            result.push(
              `- ${localColumn.name} -> ${referencedTable.name}.${referencedColumn.name}`,
            );
          }
        }
      }

      result.push('');
    }

    return result.join('\n').trim();
  }

  private formatColumn(
    column: DbColumn,
  ): string {
    let type = String(
      column.dataType,
    );

    if (
      column.length !== null
    ) {
      type += `(${column.length})`;
    } else if (
      column.precision !== null &&
      column.scale !== null
    ) {
      type += `(${column.precision},${column.scale})`;
    } else if (
      column.precision !== null
    ) {
      type += `(${column.precision})`;
    }

    const attributes: string[] = [];

    attributes.push(
      column.nullable
        ? 'NULL'
        : 'NOT NULL',
    );

    if (column.unique) {
      attributes.push('UNIQUE');
    }

    if (column.autoIncrement) {
      attributes.push(
        'AUTO_INCREMENT',
      );
    }

    if (
      column.defaultValue !== null
    ) {
      attributes.push(
        `DEFAULT ${column.defaultValue}`,
      );
    }

    return `${column.name} ${type} ${attributes.join(' ')}`;
  }
}