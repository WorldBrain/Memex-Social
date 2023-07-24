# Do main build then move output to hosting dir
env-cmd -f $ENV_FILE webpack --config webpack/webpack.prod.js
mkdir -p ../firebase/public
rm -rf ../firebase/public/*
mv build/* ../firebase/public/

# Derive bundle names (contain dynamic cache-busting hashes)
bundle_names=''
for bundle in ../firebase/public/*.{js,css}; do
    base_name=$(basename $bundle)
    bundle_names+="${base_name} "
done

# Remove trailing space
bundle_names=$(echo $bundle_names | sed 's/ *$//')

# Write latest bundle names to .env.*, so functions can access them
for env_file in ../firebase/functions/.env*; do
    # If var already there, replace, else append
    if grep -q "WEB_UI_BUNDLES=" $env_file; then
        sed -i '' -e "s/WEB_UI_BUNDLES=.*/WEB_UI_BUNDLES=\"${bundle_names}\"/" $env_file
    else
        echo "WEB_UI_BUNDLES=\"${bundle_names}\"" >> $env_file
    fi
done
