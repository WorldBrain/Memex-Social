FB_REPO_DIR=../../firebase-backend

if [[ "$SKIP_DEPLOY_SOCIAL_PREVIEW_FUNCS" = "true" ]]; then
    exit 0
fi

if ! test -d $FB_REPO_DIR; then
    echo 'firebase-backend repo not found as a sibling dir to Memex-Social repo. Please clone it'
    exit 1
fi

if [[ "$1" != "production" ]] && [[ "$1" != "staging" ]]; then
    echo 'First arg must be either "production" or "staging"'
    exit 1
fi

# Copy over generated .env.{staging,production} file from Memex-Social's firebase/functions dir to firebase-backend repo's
cp ../firebase/functions/.env.$1 $FB_REPO_DIR/firebase/functions/

# Ensure firebase-backend repo's memex-common's HEAD is pointing to the same commit as Memex-Social's
MEMEX_COMMON_HEAD=$(
    git submodule status ../external/@worldbrain/memex-common |
    awk '{print $1}' |  # Grab only the commit hash from the entire status
    sed 's/^+//'        # Remove any leading '+' from the hash
)
cd $FB_REPO_DIR/firebase/functions/external/@worldbrain/memex-common
git stash
git checkout -f $MEMEX_COMMON_HEAD

# Now install deps in firebase/functions
cd ../../..
yarn

# Now install deps in repo root
cd ../..
yarn

# Now deploy the social preview functions
yarn firebase -P $1 deploy --only functions:generateAnnotationSocialPreview,functions:generatePageSocialPreview,functions:generateListSocialPreview
