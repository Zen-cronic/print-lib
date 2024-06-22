type ApiOpts = {
  link: string;
  linkType: "file" | "dir" | "recursive";
  auth: string;
  userAgent: string;
  convertTo: "word" | "pdf";
};

declare const printLib: (opts: ApiOpts) => Promise<void>;
declare const execConversion: (
  convertTo: ApiOpts["convertTo"]
) => Promise<void>;
declare const CODE_DIR_PATH: string;
declare const WORD_DIR_PATH: string;
declare const PDF_DIR_PATH: string;

export {
  printLib,
  execConversion,
  CODE_DIR_PATH,
  WORD_DIR_PATH,
  PDF_DIR_PATH,
  ApiOpts,
};
