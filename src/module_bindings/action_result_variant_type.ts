// THIS FILE IS AUTOMATICALLY GENERATED BY SPACETIMEDB. EDITS TO THIS FILE
// WILL NOT BE SAVED. MODIFY TABLES IN YOUR MODULE SOURCE CODE INSTEAD.

// This was generated using spacetimedb cli version 1.2.0 (commit fb41e50eb73573b70eea532aeb6158eaac06fae0).

/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
import {
  AlgebraicType,
  AlgebraicValue,
  BinaryReader,
  BinaryWriter,
  ConnectionId,
  DbConnectionBuilder,
  DbConnectionImpl,
  Identity,
  ProductType,
  ProductTypeElement,
  SubscriptionBuilderImpl,
  SumType,
  SumTypeVariant,
  TableCache,
  TimeDuration,
  Timestamp,
  deepEqual,
  type CallReducerFlags,
  type DbContext,
  type ErrorContextInterface,
  type Event,
  type EventContextInterface,
  type ReducerEventContextInterface,
  type SubscriptionEventContextInterface,
} from "@clockworklabs/spacetimedb-sdk";
// A namespace for generated variants and helper functions.
export namespace ActionResultVariant {
  // These are the generated variant types for each variant of the tagged union.
  // One type is generated per variant and will be used in the `value` field of
  // the tagged union.
  export type Ok = { tag: "Ok" };
  export type Err = { tag: "Err", value: string };

  // Helper functions for constructing each variant of the tagged union.
  // ```
  // const foo = Foo.A(42);
  // assert!(foo.tag === "A");
  // assert!(foo.value === 42);
  // ```
  export const Ok = { tag: "Ok" };
  export const Err = (value: string): ActionResultVariant => ({ tag: "Err", value });

  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createSumType([
      new SumTypeVariant("Ok", AlgebraicType.createProductType([])),
      new SumTypeVariant("Err", AlgebraicType.createStringType()),
    ]);
  }

  export function serialize(writer: BinaryWriter, value: ActionResultVariant): void {
      ActionResultVariant.getTypeScriptAlgebraicType().serialize(writer, value);
  }

  export function deserialize(reader: BinaryReader): ActionResultVariant {
      return ActionResultVariant.getTypeScriptAlgebraicType().deserialize(reader);
  }

}

// The tagged union or sum type for the algebraic type `ActionResultVariant`.
export type ActionResultVariant = ActionResultVariant.Ok | ActionResultVariant.Err;

export default ActionResultVariant;

