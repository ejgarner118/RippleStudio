declare module "des.js" {
  const des: {
    DES: unknown;
    CBC: {
      instantiate: (base: unknown) => {
        create: (o: Record<string, unknown>) => {
          update: (d: number[]) => number[];
          final: () => number[];
        };
      };
    };
  };
  export default des;
}
