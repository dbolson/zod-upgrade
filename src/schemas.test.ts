import { describe, expect, test } from "vitest";
import { z as z3 } from "zod3";
import { z as z4 } from "zod4";

describe("string with description", () => {
  const expected = "123";

  test("zod3", () => {
    const schema = z3
      .string({ description: "test description" })
      .regex(/^[1-9]\d*$/);

    const result = schema.parse("123");

    expect(schema.description).toEqual("test description");
    expect(result).toEqual(expected);
  });

  test("zod4", () => {
    const schema = z4
      .string()
      .regex(/^[1-9]\d*$/)
      .describe("test description");

    const result = schema.parse("123");

    expect(schema.description).toEqual("test description");
    expect(result).toEqual(expected);
  });
});

describe("datetime", () => {
  const expected = "2020-01-01T06:15:00Z";

  test("zod3", () => {
    const schema = z3.string().datetime().nullable();

    const result = schema.parse("2020-01-01T06:15:00Z");

    expect(result).toEqual(expected);
  });

  test("zod4", () => {
    const schema = z4.iso.datetime().nullable();

    const result = schema.parse("2020-01-01T06:15:00Z");

    expect(result).toEqual(expected);
  });
});

describe("looseObject", () => {
  const expected = {
    foo: "bar",
  };

  test("zod3", () => {
    const schema = z3.record(z3.unknown());

    const result = schema.parse({
      foo: "bar",
    });

    expect(result).toEqual(expected);
  });

  test("zod4", () => {
    const schema = z4.looseObject({});

    const result = schema.parse({
      foo: "bar",
    });

    expect(result).toEqual(expected);
  });
});

describe("passthrough", () => {
  const expected = {
    extra: "field",
    required: true,
  };

  test("zod3", () => {
    const schema = z3
      .object({
        required: z3.boolean(),
      })
      .passthrough();

    const result = schema.parse({
      extra: "field",
      required: true,
    });

    expect(result).toEqual(expected);
  });

  test("zod4", () => {
    const schema = z4.looseObject({});

    const result = schema.parse({
      extra: "field",
      required: true,
    });

    expect(result).toEqual(expected);
  });
});

describe("record", () => {
  const expected = {
    "1": "field",
  };

  test("zod3", () => {
    const schema = z3.record(z3.string());

    const result = schema.parse({
      1: "field",
    });

    expect(result).toEqual(expected);
  });

  test("zod4", () => {
    const schema = z4.record(z4.string(), z4.string());

    const result = schema.parse({
      1: "field",
    });

    expect(result).toEqual(expected);
  });
});

describe("custom error", () => {
  describe("zod3", () => {
    const ENV_SCHEMA = z3.object({
      NODE_ENV: z3.enum([
        "production",
        "development",
        "test",
        "testing",
        "staging",
        "local",
      ]),
      OTHER: z3.string().min(1),
    });
    const TEST_ENV: Record<string, string> = {
      NODE_ENV: "invalid",
      OTHER: "",
    };

    const getEnv = () => {
      const ENV: Readonly<z3.infer<typeof ENV_SCHEMA>> = ENV_SCHEMA.parse(
        TEST_ENV,
        {
          errorMap: ({ path: [name], code, message = "no message" }) => ({
            message:
              name && name in process.env
                ? `INVALID ENVIRONMENT VARIABLE: ${name} (${code}: ${message})`
                : `MISSING ENVIRONMENT VARIABLE: ${name}`,
          }),
        },
      );

      return ENV;
    };

    test("fails with invalid environment variable", () => {
      try {
        getEnv()["NODE_ENV"];
      } catch (err: unknown) {
        if (!(err instanceof z3.ZodError)) {
          throw new Error("expected ZodError");
        }
        if (!err.issues[0]) {
          throw new Error("expected error");
        }
        expect(err.issues[0].message).toEqual(
          "INVALID ENVIRONMENT VARIABLE: NODE_ENV (invalid_enum_value: no message)",
        );
      }
    });

    test("fails with missing environment variable", () => {
      try {
        getEnv()["NODE_ENV"];
      } catch (err: unknown) {
        if (!(err instanceof z3.ZodError)) {
          throw new Error("expected ZodError");
        }
        if (!err.issues[1]) {
          throw new Error("expected error");
        }
        expect(err.issues[1].message).toEqual(
          "MISSING ENVIRONMENT VARIABLE: OTHER",
        );
      }
    });
  });

  describe("zod4", () => {
    const ENV_SCHEMA = z4.object({
      NODE_ENV: z4.enum([
        "production",
        "development",
        "test",
        "testing",
        "staging",
        "local",
      ]),
      OTHER: z4.string().min(1),
    });
    const TEST_ENV: Record<string, string> = {
      NODE_ENV: "invalid",
      OTHER: "",
    };

    const getEnv = () => {
      const ENV: Readonly<z4.infer<typeof ENV_SCHEMA>> = ENV_SCHEMA.parse(
        TEST_ENV,
        {
          error: (issue) => {
            const message = issue.message ?? "no message";
            const missingVariableMessage = "MISSING ENVIRONMENT VARIABLE";
            if (!issue.path || !issue.path[0]) {
              return `${missingVariableMessage}: unknown`;
            }

            return issue.path[0] in process.env
              ? `INVALID ENVIRONMENT VARIABLE: ${String(issue.path[0])} (${issue.code}: ${message})`
              : `${missingVariableMessage}: ${String(issue.path[0])}`;
          },
        },
      );

      return ENV;
    };

    test("fails with invalid environment variable", () => {
      try {
        getEnv()["NODE_ENV"];
      } catch (err: unknown) {
        if (!(err instanceof z4.ZodError)) {
          throw new Error("expected ZodError");
        }
        if (!err.issues[0]) {
          throw new Error("expected error");
        }
        expect(err.issues[0].message).toEqual(
          "INVALID ENVIRONMENT VARIABLE: NODE_ENV (invalid_value: no message)",
        );
      }
    });

    test("fails with missing environment variable", () => {
      try {
        getEnv()["NODE_ENV"];
      } catch (err: unknown) {
        if (!(err instanceof z4.ZodError)) {
          throw new Error("expected ZodError");
        }
        if (!err.issues[1]) {
          throw new Error("expected error");
        }
        expect(err.issues[1].message).toEqual(
          "MISSING ENVIRONMENT VARIABLE: OTHER",
        );
      }
    });
  });
});

describe("required_error", () => {
  test("zod3", () => {
    const schema = z3.object({
      applicationId: z3.string({
        required_error: "this is required",
      }),
    });

    const result = schema.safeParse({
      applicationId: undefined,
    });

    if (result.success) {
      throw new Error("expected failure");
    }
    if (!result.error.issues[0]) {
      throw new Error("expected issues");
    }

    expect(result.error.issues[0].message).toEqual("this is required");
  });

  test("zod4", () => {
    const schema = z4.object({
      applicationId: z4.string({
        error: (issue) => {
          if (issue.input === undefined) {
            return "this is required";
          }
        },
      }),
    });

    const result = schema.safeParse({
      applicationId: undefined,
    });

    if (result.success) {
      throw new Error("expected failure");
    }
    if (!result.error.issues[0]) {
      throw new Error("expected issues");
    }

    expect(result.error.issues[0].message).toEqual("this is required");
  });
});

describe("invalid_type_error", () => {
  test("zod3", () => {
    const schema = z3.object({
      applicationId: z3.string({
        invalid_type_error: "this must be a string",
      }),
    });

    const result = schema.safeParse({
      applicationId: 1,
    });

    if (result.success) {
      throw new Error("expected failure");
    }
    if (!result.error.issues[0]) {
      throw new Error("expected issues");
    }

    expect(result.error.issues[0].message).toEqual("this must be a string");
  });

  test("zod4", () => {
    const schema = z4.object({
      applicationId: z4.string({
        error: (issue) => {
          return issue.input === undefined
            ? "this is required"
            : "this must be a string";
        },
      }),
    });

    const result = schema.safeParse({
      applicationId: 1,
    });

    if (result.success) {
      throw new Error("expected failure");
    }
    if (!result.error.issues[0]) {
      throw new Error("expected issues");
    }

    expect(result.error.issues[0].message).toEqual("this must be a string");
  });
});

// TODO
// [ ] add .optional() to looseObject()
