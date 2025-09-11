module.exports = (policyContext, _config, { strapi }) => {
    
    if (policyContext?.state?.user) {
      return true;
    }

    return policyContext.unauthorized('Login required');
  };