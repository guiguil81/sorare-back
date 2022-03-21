import fs from 'fs';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import https from 'https';
import fetch, { Headers } from 'node-fetch';
import { GraphQLClient, gql } from 'graphql-request';

const privateKey = fs.readFileSync(
  '/etc/letsencrypt/live/api.sorare.webdevvision.fr/privkey.pem',
  'utf8'
);
const certificate = fs.readFileSync(
  '/etc/letsencrypt/live/api.sorare.webdevvision.fr/fullchain.pem',
  'utf8'
);
const credentials = { key: privateKey, cert: certificate };

const app = express();
app.use(cors());
app.use(bodyParser.json());

// get user salt
app.get('/salt', async function (req, res) {
  const email = req.query.email;
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  return await fetch(`https://api.sorare.com/api/v1/users/${email}`, {
    method: 'get',
    headers: myHeaders,
  })
    .then((response) => response.json())
    .then((response) => {
      return res.send({
        status: 200,
        salt: response.salt,
      });
    })
    .catch(() => {
      return res.send({
        status: 500,
        salt: null,
      });
    });
});

// signIn user
app.post('/signin', async (request, response) => {
  const endpoint = 'https://api.sorare.com/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      'content-type': 'application/json',
    },
  });

  const mutation = gql`
    mutation SignInMutation($input: signInInput!) {
      signIn(input: $input) {
        currentUser {
          slug
          jwtToken(aud: "api.sorare.webdevvision") {
            token
            expiredAt
          }
        }
        otpSessionChallenge
        errors {
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: request.body.email,
      password: request.body.hashedPassword,
    },
  };

  console.log('variables', variables);
  try {
    const data = await graphQLClient.request(mutation, variables);
    return response.send({
      status: 200,
      data: data,
    });
  } catch (error) {
    return response.send({
      status: 500,
      data: null,
    });
  }
});

// signIn user with 2fa
app.post('/signin2fa', async (request, response) => {
  const endpoint = 'https://api.sorare.com/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      'content-type': 'application/json',
    },
  });

  const mutation = gql`
    mutation SignInMutation($input: signInInput!) {
      signIn(input: $input) {
        currentUser {
          slug
          jwtToken(aud: "api.sorare.webdevvision") {
            token
            expiredAt
          }
        }
        otpSessionChallenge
        errors {
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      otpSessionChallenge: request.body.otpSessionChallenge,
      otpAttempt: request.body.otpAttempt,
    },
  };

  try {
    const data = await graphQLClient.request(mutation, variables);
    return response.send({
      status: 200,
      data: data,
    });
  } catch (error) {
    return response.send({
      status: 500,
      data: null,
    });
  }
});

// get basic profile information
app.get('/basicuser', async function (req, res) {
  const token = req.query.token;
  const endpoint = 'https://api.sorare.com/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + token,
      'JWT-AUD': 'api.sorare.webdevvision',
    },
  });

  const query = gql`
    query {
      currentUser {
        email
        slug
        profile {
          pictureUrl
          clubName
        }
        nickname
        totalBalance
        ethereumAddress
        bankBalance
        bankMappedEthereumAddress
        depositedEth
        ethVaultId
        sorareAddress
        starkKey
      }
    }
  `;

  try {
    const data = await graphQLClient.request(query);
    return res.send({
      status: 200,
      data: data,
    });
  } catch (error) {
    return res.send({
      status: 500,
      data: null,
    });
  }
});

// get user cards
app.get('/usercards', async function (req, res) {
  const token = req.query.token;

  const endpoint = 'https://api.sorare.com/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + token,
      'JWT-AUD': 'api.sorare.webdevvision',
    },
  });

  const query = gql`
    query ($cursor: String) {
      currentUser {
        cardsCount
        paginatedCards(first: 50, after: $cursor) {
          edges {
            node {
              age
              id
              name
              pictureUrl
              rarity
              slug
              u23Eligible
              serialNumber
              position
              ownerSince
              power
              player {
                so5Scores(last: 10) {
                  score
                }
              }
            }
            cursor
          }
          pageInfo {
            startCursor
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  let cursor = null;
  let hasNextPage = true;
  const tabReturn = [];

  do {
    const data = await graphQLClient.request(query, {
      cursor,
    });
    const paginatedCards = data['currentUser']['paginatedCards'];
    tabReturn.push({
      startCursor: cursor,
      endCursor: paginatedCards['pageInfo']['endCursor'],
      cards: paginatedCards['edges'],
    });
    cursor = paginatedCards['pageInfo']['endCursor'];
    hasNextPage = paginatedCards['pageInfo']['hasNextPage'];
  } while (hasNextPage);

  return res.send({
    status: 200,
    data: tabReturn,
  });
});

// get club players
app.get('/getplayersforoneclub', async function (req, res) {
  const token = req.query.token;
  const endpoint = 'https://api.sorare.com/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + token,
      'JWT-AUD': 'api.sorare.webdevvision',
    },
  });

  let slug = req.query.slug;
  const query = gql`
    query ($slug: String!) {
      club(slug: $slug) {
        activePlayers {
          edges {
            node {
              slug,
              age,
              pictureUrl,
              position,
              displayName,
              shirtNumber,
            }
          }
        }
      } 
    }
  `;

  try {
    console.log('on va bin ici ?', slug)
    const data = await graphQLClient.request(query, {slug});
    console.log('data', data)
    return res.send({
      status: 200,
      data: data,
    });
  } catch (error) {
    console.log('err', error)
    return res.send({
      status: 500,
      data: null,
    });
  }
});
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(2445);
