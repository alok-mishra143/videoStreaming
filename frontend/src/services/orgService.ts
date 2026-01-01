import API from "./api";

export interface Organization {
  _id: string;
  name: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  members: {
    user: {
      _id: string;
      username: string;
      email: string;
    };
    role: "viewer" | "editor";
    _id: string;
  }[];
}

export const getMyOrgs = async () => {
  const { data } = await API.get<Organization[]>("/orgs");
  return data;
};

export const addMember = async (
  orgId: string,
  email: string,
  role: "viewer" | "editor"
) => {
  const { data } = await API.post<Organization>(`/orgs/${orgId}/members`, {
    email,
    role,
  });
  return data;
};

export const updateMemberRole = async (
  orgId: string,
  userId: string,
  role: "viewer" | "editor"
) => {
  const { data } = await API.put<Organization>(
    `/orgs/${orgId}/members/${userId}`,
    {
      role,
    }
  );
  return data;
};

export const removeMember = async (orgId: string, userId: string) => {
  const { data } = await API.delete<Organization>(
    `/orgs/${orgId}/members/${userId}`
  );
  return data;
};
