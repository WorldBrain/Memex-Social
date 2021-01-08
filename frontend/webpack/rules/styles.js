import {
    cssLoader,
    miniCssExtractLoader,
    postCssLoader,
    resolveUrlLoader,
} from './useLoaderRuleItems';

export const cssRule = {
    test: /\.css$/,
    use: [miniCssExtractLoader, postCssLoader, resolveUrlLoader, cssLoader],
};
