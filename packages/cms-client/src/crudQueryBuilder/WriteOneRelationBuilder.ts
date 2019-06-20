import { Input } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { DataBuilder } from './DataBuilder'
import { WriteRelationOps, WriteOperation } from './types'
import { WriteDataBuilder } from './WriteDataBuilder'

class WriteOneRelationBuilder<
	Op extends WriteOperation,
	Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op],
	D extends WriteOneRelationBuilder.DataFormat[Op] | undefined = WriteOneRelationBuilder.DataFormat[Op]
> {
	protected constructor(public readonly data: D = undefined as D) {}

	public static instantiate<
		Op extends WriteOperation,
		Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op],
		D extends WriteOneRelationBuilder.DataFormat[Op] | undefined = WriteOneRelationBuilder.DataFormat[Op]
	>(data: D = undefined as D): WriteOneRelationBuilder.Builder<Op, Allowed, D> {
		return new WriteOneRelationBuilder<Op, Allowed, D>(data)
	}

	public static instantiateFromFactory<
		Op extends WriteOperation,
		Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op],
		D extends WriteOneRelationBuilder.DataFormat[Op] | undefined = WriteOneRelationBuilder.DataFormat[Op]
	>(builder: WriteOneRelationBuilder.BuilderFactory<Op, Allowed, D>): WriteOneRelationBuilder.Builder<Op, never, D> {
		if (typeof builder === 'function') {
			return builder(WriteOneRelationBuilder.instantiate())
		}
		if ('data' in builder) {
			return WriteOneRelationBuilder.instantiate(builder.data)
		}
		return WriteOneRelationBuilder.instantiate(builder)
	}

	public create(
		data: DataBuilder.DataLike<WriteDataBuilder.DataFormat['create'], WriteDataBuilder<WriteOperation.Create>>
	) {
		const resolvedData = DataBuilder.resolveData(data, WriteDataBuilder as {
			new (): WriteDataBuilder<WriteOperation.Create>
		})
		return resolvedData === undefined
			? this
			: WriteOneRelationBuilder.instantiate<Op, never>({
					create: resolvedData
			  })
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return WriteOneRelationBuilder.instantiate<Op, never>({ connect: where })
	}

	public delete() {
		return WriteOneRelationBuilder.instantiate<WriteOperation.Update, never>({ delete: true })
	}

	public disconnect() {
		return WriteOneRelationBuilder.instantiate<WriteOperation.Update, never>({ disconnect: true })
	}

	public update(
		data: DataBuilder.DataLike<WriteDataBuilder.DataFormat['update'], WriteDataBuilder<WriteOperation.Update>>
	) {
		const resolvedData = DataBuilder.resolveData(data, WriteDataBuilder as {
			new (): WriteDataBuilder<WriteOperation.Update>
		})
		return resolvedData === undefined ? this : new WriteOneRelationBuilder({ update: resolvedData })
	}

	public upsert(
		update: DataBuilder.DataLike<WriteDataBuilder.DataFormat['update'], WriteDataBuilder<WriteOperation.Update>>,
		create: DataBuilder.DataLike<WriteDataBuilder.DataFormat['create'], WriteDataBuilder<WriteOperation.Create>>
	) {
		const resolvedCreate = DataBuilder.resolveData(create, WriteDataBuilder as {
			new (): WriteDataBuilder<WriteOperation.Create>
		})
		const resolvedUpdate = DataBuilder.resolveData(update, WriteDataBuilder as {
			new (): WriteDataBuilder<WriteOperation.Update>
		})

		return resolvedUpdate === undefined && resolvedCreate === undefined
			? this
			: WriteOneRelationBuilder.instantiate<WriteOperation.Update, never>({
					upsert: {
						update: resolvedUpdate || {},
						create: resolvedCreate || {}
					}
			  })
	}
}

namespace WriteOneRelationBuilder {
	export interface DataFormat {
		create: Input.CreateOneRelationInput<Literal>
		update: Input.UpdateOneRelationInput<Literal>
	}

	export type Builder<
		Op extends WriteOperation,
		Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op],
		D extends WriteOneRelationBuilder.DataFormat[Op] | undefined = WriteOneRelationBuilder.DataFormat[Op]
	> = Omit<WriteOneRelationBuilder<Op, Allowed, D>, Exclude<WriteRelationOps[WriteOperation], Allowed>>

	export type BuilderFactory<
		Op extends WriteOperation,
		Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op],
		D extends WriteOneRelationBuilder.DataFormat[Op] | undefined = WriteOneRelationBuilder.DataFormat[Op]
	> = D | Builder<Op, never, D> | ((builder: Builder<Op, Allowed, D>) => Builder<Op, never, D>)
}

export { WriteOneRelationBuilder }